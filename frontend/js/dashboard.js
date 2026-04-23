/**
 * DASHBOARD.JS — Módulo de Gestão da Inteligência Operacional
 * Controla: Autenticação, Interface, Mapa Leaflet, Gráficos e Filtros
 */

const AppState = {
    map: null,
    layers: { batalhoes: null },
    charts: {
        unidades:           null,
        efetivo:            null,
        ocorrenciasRegiao:  null,
        ocorrenciasPeriodo: null,
        evolucaoSemanal:    null,
        resolucaoCorp:      null,
        efetivoRegional:    null
    }
};

const CORES = {
    PM:     '#1976d2',
    CBM:    '#d32f2f',
    GM:     '#fbc02d',
    green:  '#008959',
    orange: '#E65100'
};

/* Paleta de regionais — baseada no arquivo regionais.json */
const CORES_REGIONAIS = {
    'SER I': '#aaff00',
    'SER II': '#aaaa00',
    'SER III': '#5500ff',
    'SER IV': '#aa557f',
    'SER V': '#aaaa7f',
    'SER VI': '#55ffff',
    'SERCEFOR': '#ff0000',
    'Centro': '#008959'
};

document.addEventListener('DOMContentLoaded', () => {
    const usuario = validarAcesso();
    if (usuario) {
        configurarInterface(usuario);
        configurarMenuLateral();
        configurarMapa();
        configurarFiltros();
        carregarDadosOperacionais();
        renderizarGraficosOcorrencias();
        renderizarGraficosComplementares();
    }
});

/* ==========================================
   1. SEGURANÇA E INTERFACE
========================================== */
function validarAcesso() {
    const session = localStorage.getItem('usuario');
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(session);
}

function configurarInterface(usuario) {
    const elNome     = document.getElementById('dash_user_name');
    const elRole     = document.getElementById('dash_user_role');
    const elInitials = document.getElementById('dash_user_initials');

    if (elNome)     elNome.textContent     = usuario.nome || 'Agente';
    if (elRole)     elRole.textContent     = `${usuario.tipo_militar || ''} ${usuario.corporacao || ''}`.trim();
    if (elInitials && usuario.nome) {
        const partes = usuario.nome.trim().split(' ');
        elInitials.textContent = partes.length > 1
            ? (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
            : usuario.nome.substring(0, 2).toUpperCase();
    }

    document.getElementById('btn_logout_dash')?.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja encerrar a sessão segura?')) {
            localStorage.removeItem('usuario');
            window.location.href = 'login.html';
        }
    });
}

/* ==========================================
   2. MENU LATERAL (HAMBÚRGUER)
========================================== */
function configurarMenuLateral() {
    const btnMenu  = document.getElementById('hamburger');
    const btnClose = document.getElementById('sidebar_close');
    const sidebar  = document.getElementById('sidebar_nav');
    const overlay  = document.getElementById('nav_overlay');

    function abrirMenu() {
        sidebar?.classList.add('is_open');
        overlay?.classList.add('is_visible');
        btnMenu?.setAttribute('aria-expanded', 'true');
        sidebar?.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function fecharMenu() {
        sidebar?.classList.remove('is_open');
        overlay?.classList.remove('is_visible');
        btnMenu?.setAttribute('aria-expanded', 'false');
        sidebar?.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    btnMenu?.addEventListener('click', abrirMenu);
    btnClose?.addEventListener('click', fecharMenu);
    overlay?.addEventListener('click', fecharMenu);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharMenu(); });
}

/* ==========================================
   3. MAPA LEAFLET
========================================== */
function configurarMapa() {
    if (!document.getElementById('map_wrapper')) return;
    
    AppState.map = L.map('map_wrapper').setView([-3.7327, -38.5270], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(AppState.map);

    AppState.layers.batalhoes = L.layerGroup().addTo(AppState.map);

    // Carrega as demarcações das regionais do arquivo local GeoJSON
    fetch('../data/regionais.json')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: function (feature) {
                    const nome = feature.properties?.name || '';
                    return {
                        fillColor: CORES_REGIONAIS[nome] || feature.properties.fill || '#00b37e',
                        color: feature.properties.stroke || '#008959',
                        weight: feature.properties['stroke-width'] || 2,
                        fillOpacity: feature.properties['fill-opacity'] || 0.3,
                        opacity: feature.properties['stroke-opacity'] || 1
                    };
                },
                onEachFeature: function (feature, layer) {
                    if (feature.properties && feature.properties.name) {
                        layer.bindPopup(`<div style="text-align: center;"><b>${feature.properties.name}</b></div>`);
                    }
                }
            }).addTo(AppState.map);
        })
        .catch(error => console.error('Erro ao carregar as demarcações das regionais:', error));
    
    // Força o recalculo do mapa para não quebrar a Grid CSS
    setTimeout(() => AppState.map.invalidateSize(), 400);
}

/* ==========================================
   4. FILTROS
========================================== */
function configurarFiltros() {
    const ids    = ['corporation', 'regional', 'turno', 'status'];
    const atualizar = () => {
        const [corp, reg] = ids.map(id => document.getElementById(id)?.value || 'todas');
        carregarDadosOperacionais(corp, reg);
    };

    ids.forEach(id => document.getElementById(id)?.addEventListener('change', atualizar));

    document.getElementById('btn_reset')?.addEventListener('click', () => {
        ids.forEach(id => { const el = document.getElementById(id); if (el) el.selectedIndex = 0; });
        atualizar();
    });
}

/* ==========================================
   5. DADOS MOCKADOS BASEADOS NO regionais.json
========================================== */

// Unidades distribuídas pelas 8 regiões do arquivo regionais.json
const DADOS_FALLBACK = [
    // SER I
    { nome: '1º BPM - Centro', corporacao: 'PM', regional: 'SER I', latitude: -3.7275, longitude: -38.5275, efetivo: 450 },
    { nome: '1º CBM - Jacarecanga', corporacao: 'CBM', regional: 'SER I', latitude: -3.7250, longitude: -38.5410, efetivo: 120 },
    { nome: '1ª GM - Lagoinha', corporacao: 'GM', regional: 'SER I', latitude: -3.7260, longitude: -38.5300, efetivo: 200 },
    
    // SER II
    { nome: '2º BPM - Aldeota', corporacao: 'PM', regional: 'SER II', latitude: -3.73805, longitude: -38.50222, efetivo: 380 },
    { nome: '8º BPM (Aldeota)', corporacao: 'PM', regional: 'SER II', latitude: -3.73805, longitude: -38.50222, efetivo: 200 },
    { nome: 'CPChoque / COTAM', corporacao: 'PM', regional: 'SER II', latitude: -3.74611, longitude: -38.46166, efetivo: 400 },
    { nome: 'Torre GM Beira Mar', corporacao: 'GM', regional: 'SER II', latitude: -3.7280, longitude: -38.4980, efetivo: 15 },
    
    // SER III
    { nome: '3º BPM', corporacao: 'PM', regional: 'SER III', latitude: -3.7475, longitude: -38.5475, efetivo: 520 },
    { nome: 'CPRAIO', corporacao: 'PM', regional: 'SER III', latitude: -3.73472, longitude: -38.55333, efetivo: 300 },
    
    // SER IV
    { nome: 'Comando Geral BBM', corporacao: 'CBM', regional: 'SER IV', latitude: -3.7530, longitude: -38.5330, efetivo: 80 },
    { nome: '5º BPM', corporacao: 'PM', regional: 'SER IV', latitude: -3.7575, longitude: -38.5575, efetivo: 290 },
    
    // SER V
    { nome: '6º BPM', corporacao: 'PM', regional: 'SER V', latitude: -3.7675, longitude: -38.5675, efetivo: 340 },
    { nome: '4º CBM', corporacao: 'CBM', regional: 'SER V', latitude: -3.7655, longitude: -38.5655, efetivo: 75 },
    
    // SER VI
    { nome: '3ª Cia BBM (Messejana)', corporacao: 'CBM', regional: 'SER VI', latitude: -3.8320, longitude: -38.4980, efetivo: 40 },
    { nome: '3º BPM - Messejana', corporacao: 'PM', regional: 'SER VI', latitude: -3.8310, longitude: -38.4980, efetivo: 520 },
    { nome: 'Torre GM Jangurussu', corporacao: 'GM', regional: 'SER VI', latitude: -3.8310, longitude: -38.5080, efetivo: 15 },
    
    // SERCEFOR (Região Central)
    { nome: '7º BPM', corporacao: 'PM', regional: 'SERCEFOR', latitude: -3.7775, longitude: -38.5775, efetivo: 410 },
    { nome: 'Batalhão Especial', corporacao: 'PM', regional: 'SERCEFOR', latitude: -3.7815, longitude: -38.5815, efetivo: 220 },
    { nome: '5º CBM', corporacao: 'CBM', regional: 'SERCEFOR', latitude: -3.7755, longitude: -38.5755, efetivo: 105 },
    { nome: '6ª GM', corporacao: 'GM', regional: 'SERCEFOR', latitude: -3.7795, longitude: -38.5795, efetivo: 140 },
    
    // Centro (para compatibilidade)
    { nome: '1º CRPM / 5º BPM', corporacao: 'PM', regional: 'Centro', latitude: -3.72833, longitude: -38.52833, efetivo: 250 },
    { nome: 'Torre GM Lagoinha', corporacao: 'GM', regional: 'Centro', latitude: -3.72600, longitude: -38.53000, efetivo: 15 }
];

// Dados de ocorrências por região (baseado nas 8 regiões do regionais.json)
const MOCK_OCORRENCIAS_REGIAO = {
    labels: ['SER I', 'SER II', 'SER III', 'SER IV', 'SER V', 'SER VI', 'SERCEFOR', 'Centro'],
    dados: [89, 213, 97, 76, 54, 118, 156, 142]
};

// Dados de ocorrências por período
const MOCK_OCORRENCIAS_PERIODO = {
    labels: ['Madrugada\n00–06h', 'Manhã\n06–12h', 'Tarde\n12–18h', 'Noite\n18–00h'],
    dados: [187, 134, 198, 270]
};

// Dados de evolução semanal
const MOCK_EVOLUCAO_SEMANAL = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    atual: [48, 62, 55, 71, 83, 94, 61],
    anterior: [40, 55, 60, 65, 78, 88, 55]
};

// Dados de resolução por corporação
const MOCK_RESOLUCAO_CORP = {
    labels: ['Polícia Militar', 'Corpo de Bombeiros', 'Guarda Municipal'],
    resolvidas: [74, 91, 63],
    pendentes: [26, 9, 37]
};

// Dados de efetivo por regional (baseado nas 8 regiões)
const MOCK_EFETIVO_REGIONAL = {
    labels: ['SER I', 'SER II', 'SER III', 'SER IV', 'SER V', 'SER VI', 'SERCEFOR', 'Centro'],
    dados: [770, 995, 820, 370, 415, 575, 875, 265]
};

async function carregarDadosOperacionais(corp = 'todas', reg = 'todas') {
    let dados = [];
    try {
        const res = await fetch(`http://localhost:3000/api/unidades?corporacao=${corp}&regional=${reg}`);
        if (!res.ok) throw new Error('API indisponível');
        dados = await res.json();
        console.log('✅ Dados carregados da API');
    } catch (error) {
        console.warn('⚠️ API offline — usando dados mockados baseados no regionais.json');
        dados = DADOS_FALLBACK.filter(u =>
            (corp === 'todas' || u.corporacao === corp) &&
            (reg  === 'todas' || u.regional   === reg)
        );
    }

    atualizarKPIs(dados);
    renderizarMapaMarcadores(dados);
    renderizarGraficosPrincipais(dados);
}

/* ==========================================
   6. KPIs
========================================== */
function atualizarKPIs(dados) {
    const elBat = document.getElementById('total_batalhoes');
    const elEf  = document.getElementById('total_efetivo');
    if (elBat) elBat.textContent = dados.length;
    if (elEf)  elEf.textContent  = dados.reduce((s, u) => s + (u.efetivo || 0), 0).toLocaleString('pt-BR');
}

/* ==========================================
   7. MAPA — MARCADORES
========================================== */
function renderizarMapaMarcadores(dados) {
    if (!AppState.layers.batalhoes) return;
    AppState.layers.batalhoes.clearLayers();
    
    dados.forEach(u => {
        const cor    = CORES[u.corporacao] || '#555';
        const marker = L.circleMarker([u.latitude, u.longitude], {
            color: cor, fillColor: cor, fillOpacity: 0.8, radius: 7, weight: 2
        }).bindPopup(`
            <strong>${u.nome}</strong><br>
            Força: ${u.corporacao}<br>
            Regional: ${u.regional}<br>
            Efetivo: ${u.efetivo.toLocaleString('pt-BR')}
        `);
        
        marker.addTo(AppState.layers.batalhoes);
    });
}

/* ==========================================
   8. GRÁFICOS PRINCIPAIS (dinâmicos — reagem aos filtros)
========================================== */
function renderizarGraficosPrincipais(dados) {
    const cnt = { PM: { u: 0, e: 0 }, CBM: { u: 0, e: 0 }, GM: { u: 0, e: 0 } };
    dados.forEach(u => {
        if (cnt[u.corporacao]) {
            cnt[u.corporacao].u++;
            cnt[u.corporacao].e += u.efetivo || 0;
        }
    });

    /* Barras — Unidades por Corporação */
    const ctxUnid = document.getElementById('bar_chart_unidades');
    if (ctxUnid) {
        AppState.charts.unidades?.destroy();
        AppState.charts.unidades = new Chart(ctxUnid, {
            type: 'bar',
            data: {
                labels: ['Polícia Militar', 'Bombeiros', 'Guarda Municipal'],
                datasets: [{
                    label: 'Unidades Ativas',
                    data: [cnt.PM.u, cnt.CBM.u, cnt.GM.u],
                    backgroundColor: [CORES.PM, CORES.CBM, CORES.GM],
                    borderRadius: 6,
                    barPercentage: 0.7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.04)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    /* Rosca — Distribuição de Efetivo */
    const ctxEf = document.getElementById('doughnut_efetivo');
    if (ctxEf) {
        AppState.charts.efetivo?.destroy();
        AppState.charts.efetivo = new Chart(ctxEf, {
            type: 'doughnut',
            data: {
                labels: ['PM', 'CBM', 'GM'],
                datasets: [{
                    data: [cnt.PM.e, cnt.CBM.e, cnt.GM.e],
                    backgroundColor: [CORES.PM, CORES.CBM, CORES.GM],
                    borderWidth: 2,
                    hoverOffset: 8,
                    cutout: '60%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const percent = ((ctx.raw / total) * 100).toFixed(1);
                                return `${ctx.label}: ${ctx.raw.toLocaleString('pt-BR')} (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

/* ==========================================
   9. GRÁFICOS DE OCORRÊNCIAS (baseados no regionais.json)
========================================== */
function renderizarGraficosOcorrencias() {

    /* Barras horizontais — por Região (8 regiões do regionais.json) */
    const ctxReg = document.getElementById('bar_ocorrencias_regiao');
    if (ctxReg) {
        AppState.charts.ocorrenciasRegiao?.destroy();
        AppState.charts.ocorrenciasRegiao = new Chart(ctxReg, {
            type: 'bar',
            data: {
                labels: MOCK_OCORRENCIAS_REGIAO.labels,
                datasets: [{
                    label: 'Ocorrências',
                    data: MOCK_OCORRENCIAS_REGIAO.dados,
                    backgroundColor: 'rgba(0,137,89,0.15)',
                    borderColor: CORES.green,
                    borderWidth: 1.5,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 } } },
                    y: { grid: { display: false }, ticks: { font: { size: 10 } } }
                }
            }
        });
    }

    /* Linha — Ocorrências por Período do Dia */
    const ctxPer = document.getElementById('radar_ocorrencias_periodo');
    if (ctxPer) {
        AppState.charts.ocorrenciasPeriodo?.destroy();
        AppState.charts.ocorrenciasPeriodo = new Chart(ctxPer, {
            type: 'line',
            data: {
                labels: MOCK_OCORRENCIAS_PERIODO.labels,
                datasets: [{
                    label: 'Ocorrências',
                    data: MOCK_OCORRENCIAS_PERIODO.dados,
                    borderColor: CORES.orange,
                    backgroundColor: 'rgba(230,81,0,0.10)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: CORES.orange,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                }
            }
        });
    }
}

/* ==========================================
   10. GRÁFICOS COMPLEMENTARES (baseados no regionais.json)
========================================== */
function renderizarGraficosComplementares() {

    /* ── Gráfico 1: Evolução Semanal de Ocorrências (linha) ── */
    const ctxSemanal = document.getElementById('line_evolucao_semanal');
    if (ctxSemanal) {
        AppState.charts.evolucaoSemanal?.destroy();
        AppState.charts.evolucaoSemanal = new Chart(ctxSemanal, {
            type: 'line',
            data: {
                labels: MOCK_EVOLUCAO_SEMANAL.labels,
                datasets: [
                    {
                        label: 'Esta semana',
                        data: MOCK_EVOLUCAO_SEMANAL.atual,
                        borderColor: CORES.green,
                        backgroundColor: 'rgba(0,137,89,0.08)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: CORES.green,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Semana anterior',
                        data: MOCK_EVOLUCAO_SEMANAL.anterior,
                        borderColor: CORES.orange,
                        backgroundColor: 'transparent',
                        borderDash: [5, 4],
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: CORES.orange
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: { boxWidth: 12, font: { size: 10 }, padding: 10 }
                    }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                }
            }
        });
    }

    /* ── Gráfico 2: Taxa de Resolução por Corporação (barras horizontais + %) ── */
    const ctxResolucao = document.getElementById('bar_resolucao_corporacao');
    if (ctxResolucao) {
        AppState.charts.resolucaoCorp?.destroy();
        AppState.charts.resolucaoCorp = new Chart(ctxResolucao, {
            type: 'bar',
            data: {
                labels: MOCK_RESOLUCAO_CORP.labels,
                datasets: [
                    {
                        label: 'Resolvidas',
                        data: MOCK_RESOLUCAO_CORP.resolvidas,
                        backgroundColor: 'rgba(0,137,89,0.75)',
                        borderRadius: 4,
                        stack: 'total'
                    },
                    {
                        label: 'Pendentes',
                        data: MOCK_RESOLUCAO_CORP.pendentes,
                        backgroundColor: 'rgba(230,81,0,0.65)',
                        borderRadius: 4,
                        stack: 'total'
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: { boxWidth: 12, font: { size: 10 }, padding: 10 }
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.x}%`
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        stacked: true,
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: { font: { size: 10 }, callback: v => `${v}%` }
                    },
                    y: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 } } }
                }
            }
        });
    }

    /* ── Gráfico 3: Efetivo Total por Regional (barras verticais) ──
       Baseado nas 8 regiões do arquivo regionais.json */
    const ctxEfReg = document.getElementById('bar_efetivo_regional');
    if (ctxEfReg) {
        AppState.charts.efetivoRegional?.destroy();
        
        // Cores para cada regional baseadas no regionais.json
        const coresPorRegional = MOCK_EFETIVO_REGIONAL.labels.map(regiao => CORES_REGIONAIS[regiao] || '#008959');
        
        AppState.charts.efetivoRegional = new Chart(ctxEfReg, {
            type: 'bar',
            data: {
                labels: MOCK_EFETIVO_REGIONAL.labels,
                datasets: [{
                    label: 'Efetivo Total',
                    data: MOCK_EFETIVO_REGIONAL.dados,
                    backgroundColor: coresPorRegional,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: { font: { size: 10 } },
                        title: { display: true, text: 'Quantidade de Efetivo', font: { size: 10 } }
                    },
                    x: { 
                        grid: { display: false }, 
                        ticks: { font: { size: 10 } }
                    }
                }
            }
        });
    }
}