/**
 * DASHBOARD.JS - Módulo de Gestão da Inteligência Operacional
 * Com DADOS MOCKADOS baseados no regionais.json
 */

const AppState = {
    map: null,
    layers: { batalhoes: null },
    charts: { unidades: null, efetivo: null, ocorrenciasRegiao: null, ocorrenciasPeriodo: null }
};

const CORES = {
    PM: '#1976d2', 
    CBM: '#d32f2f', 
    GM: '#fbc02d',
    green: '#008959', 
    orange: '#E65100'
};

// ==========================================
// DADOS MOCKADOS BASEADOS NO regionais.json
// ==========================================
const MOCK_BATALHOES = [
    // SER I (Centro)
    { id: 1, nome: '1º BPM', corporacao: 'PM', regional: 'SER I', latitude: -3.7275, longitude: -38.5275, efetivo: 450 },
    { id: 2, nome: '1º CBM', corporacao: 'CBM', regional: 'SER I', latitude: -3.7255, longitude: -38.5255, efetivo: 120 },
    { id: 3, nome: '1ª GM', corporacao: 'GM', regional: 'SER I', latitude: -3.7295, longitude: -38.5295, efetivo: 200 },
    
    // SER II
    { id: 4, nome: '2º BPM', corporacao: 'PM', regional: 'SER II', latitude: -3.7375, longitude: -38.5375, efetivo: 380 },
    { id: 5, nome: '2º CBM', corporacao: 'CBM', regional: 'SER II', latitude: -3.7355, longitude: -38.5355, efetivo: 95 },
    { id: 6, nome: '2ª GM', corporacao: 'GM', regional: 'SER II', latitude: -3.7395, longitude: -38.5395, efetivo: 150 },
    
    // SER III
    { id: 7, nome: '3º BPM', corporacao: 'PM', regional: 'SER III', latitude: -3.7475, longitude: -38.5475, efetivo: 520 },
    { id: 8, nome: '3º CBM', corporacao: 'CBM', regional: 'SER III', latitude: -3.7455, longitude: -38.5455, efetivo: 110 },
    { id: 9, nome: '3ª GM', corporacao: 'GM', regional: 'SER III', latitude: -3.7495, longitude: -38.5495, efetivo: 180 },
    { id: 10, nome: '4º BPM', corporacao: 'PM', regional: 'SER III', latitude: -3.7515, longitude: -38.5515, efetivo: 310 },
    
    // SER IV
    { id: 11, nome: '5º BPM', corporacao: 'PM', regional: 'SER IV', latitude: -3.7575, longitude: -38.5575, efetivo: 290 },
    { id: 12, nome: '4º CBM', corporacao: 'CBM', regional: 'SER IV', latitude: -3.7555, longitude: -38.5555, efetivo: 88 },
    { id: 13, nome: '4ª GM', corporacao: 'GM', regional: 'SER IV', latitude: -3.7595, longitude: -38.5595, efetivo: 130 },
    
    // SER V
    { id: 14, nome: '6º BPM', corporacao: 'PM', regional: 'SER V', latitude: -3.7675, longitude: -38.5675, efetivo: 340 },
    { id: 15, nome: '5º CBM', corporacao: 'CBM', regional: 'SER V', latitude: -3.7655, longitude: -38.5655, efetivo: 75 },
    { id: 16, nome: '5ª GM', corporacao: 'GM', regional: 'SER V', latitude: -3.7695, longitude: -38.5695, efetivo: 160 },
    
    // SERCEFOR (Região Central)
    { id: 17, nome: '7º BPM', corporacao: 'PM', regional: 'SERCEFOR', latitude: -3.7775, longitude: -38.5775, efetivo: 410 },
    { id: 18, nome: '6º CBM', corporacao: 'CBM', regional: 'SERCEFOR', latitude: -3.7755, longitude: -38.5755, efetivo: 105 },
    { id: 19, nome: '6ª GM', corporacao: 'GM', regional: 'SERCEFOR', latitude: -3.7795, longitude: -38.5795, efetivo: 140 },
    { id: 20, nome: 'Batalhão Especial', corporacao: 'PM', regional: 'SERCEFOR', latitude: -3.7815, longitude: -38.5815, efetivo: 220 }
];

// Dados de ocorrências por região (baseado no regionais.json)
const MOCK_OCORRENCIAS_REGIAO = {
    labels: ['SER I', 'SER II', 'SER III', 'SER IV', 'SER V', 'SERCEFOR'],
    dados: [245, 312, 428, 189, 267, 356]
};

// Dados de ocorrências por período
const MOCK_OCORRENCIAS_PERIODO = {
    labels: ['00h-04h', '04h-08h', '08h-12h', '12h-16h', '16h-20h', '20h-00h'],
    dados: [78, 145, 312, 289, 401, 356]
};

// Dados de ocorrências por tipo de ocorrência
const MOCK_OCORRENCIAS_TIPO = {
    labels: ['Roubo', 'Furto', 'Homicídio', 'Trânsito', 'Incêndio', 'Outros'],
    dados: [245, 189, 67, 432, 156, 98]
};

document.addEventListener('DOMContentLoaded', () => {
    const usuario = validarAcesso();
    if(usuario) {
        configurarInterface(usuario);
        configurarMenuLateral();
        configurarMapa();
        configurarFiltros();
        carregarDadosOperacionais(); // Dispara a busca
    }
});

// ==========================================
// 1. SEGURANÇA E INTERFACE BÁSICA
// ==========================================
function validarAcesso() {
    const session = localStorage.getItem('usuario');
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(session);
}

function configurarInterface(usuario) {
    const elNome = document.getElementById('dash_user_name');
    const elRole = document.getElementById('dash_user_role');
    const elInitials = document.getElementById('dash_user_initials');

    if(elNome) elNome.textContent = usuario.nome || 'Agente';
    if(elRole) elRole.textContent = `${usuario.tipo_militar || ''} ${usuario.corporacao || ''}`;
    
    if(elInitials && usuario.nome) {
        const partes = usuario.nome.trim().split(' ');
        elInitials.textContent = partes.length > 1 
            ? (partes[0][0] + partes[partes.length-1][0]).toUpperCase() 
            : usuario.nome.substring(0,2).toUpperCase();
    }

    document.getElementById('btn_logout_dash')?.addEventListener('click', () => {
        if(confirm('Tem certeza que deseja encerrar a sessão segura?')) {
            localStorage.removeItem('usuario');
            window.location.href = 'login.html';
        }
    });
}

function configurarMenuLateral() {
    const btnMenu = document.getElementById('hamburger');
    const btnClose = document.getElementById('sidebar_close');
    const sidebar = document.getElementById('sidebar_nav');
    const overlay = document.getElementById('nav_overlay');

    const toggleMenu = () => {
        sidebar?.classList.toggle('is_open');
        overlay?.classList.toggle('is_visible');
    };

    btnMenu?.addEventListener('click', toggleMenu);
    btnClose?.addEventListener('click', toggleMenu);
    overlay?.addEventListener('click', toggleMenu);
}

// ==========================================
// 2. CONFIGURAÇÃO DO MAPA (LEAFLET)
// ==========================================
function configurarMapa() {
    AppState.map = L.map('map_wrapper').setView([-3.7327, -38.5270], 11);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(AppState.map);
    
    AppState.layers.batalhoes = L.layerGroup().addTo(AppState.map);

    // Carrega as demarcações das regionais
    fetch('../data/regionais.json')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: function (feature) {
                    // Cores diferentes para cada regional
                    const coresRegionais = {
                        'SER I': '#aaff00',
                        'SER II': '#aaaa00',
                        'SER III': '#5500ff',
                        'SER IV': '#aa557f',
                        'SER V': '#aaaa7f',
                        'SERCEFOR': '#ff0000'
                    };
                    const nome = feature.properties?.name || '';
                    return {
                        fillColor: coresRegionais[nome] || feature.properties.fill || '#00b37e',
                        color: feature.properties.stroke || '#008959',
                        weight: feature.properties['stroke-width'] || 2,
                        fillOpacity: 0.3,
                        opacity: 1
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
    
    setTimeout(() => AppState.map.invalidateSize(), 400);
}

// ==========================================
// 3. FUNÇÃO DE FILTRAGEM DE DADOS MOCKADOS
// ==========================================
function filtrarDadosMockados(corp = 'todas', reg = 'todas') {
    let dadosFiltrados = [...MOCK_BATALHOES];
    
    if (corp !== 'todas') {
        dadosFiltrados = dadosFiltrados.filter(u => u.corporacao === corp);
    }
    
    if (reg !== 'todas') {
        dadosFiltrados = dadosFiltrados.filter(u => u.regional === reg);
    }
    
    return dadosFiltrados;
}

// ==========================================
// 4. COMUNICAÇÃO COM A API E FILTROS
// ==========================================
function configurarFiltros() {
    const selectCorp = document.getElementById('corporation');
    const selectReg = document.getElementById('regional');
    const btnReset = document.getElementById('btn_reset');

    // Popular o select de regionais com os valores do geoJSON
    if (selectReg) {
        const regionais = ['todas', 'SER I', 'SER II', 'SER III', 'SER IV', 'SER V', 'SERCEFOR'];
        regionais.forEach(reg => {
            const option = document.createElement('option');
            option.value = reg;
            option.textContent = reg === 'todas' ? 'Todas as Regionais' : reg;
            selectReg.appendChild(option);
        });
    }

    const atualizar = () => {
        const corp = selectCorp?.value || 'todas';
        const reg = selectReg?.value || 'todas';
        carregarDadosOperacionais(corp, reg);
    };
    
    selectCorp?.addEventListener('change', atualizar);
    selectReg?.addEventListener('change', atualizar);
    
    btnReset?.addEventListener('click', () => {
        if(selectCorp) selectCorp.value = 'todas';
        if(selectReg) selectReg.value = 'todas';
        atualizar();
    });
}

async function carregarDadosOperacionais(corp = 'todas', reg = 'todas') {
    try {
        // Tenta conectar com a API real
        const res = await fetch(`http://localhost:3000/api/unidades?corporacao=${corp}&regional=${reg}`);
        if (!res.ok) throw new Error('API offline');
        const dados = await res.json();
        
        atualizarKPIs(dados);
        renderizarMapaMarcadores(dados);
        renderizarGraficosPrincipais(dados);
        renderizarGraficosOcorrencias();
        renderizarGraficosOcorrenciasPorTipo();
        
        console.log('✅ Dados carregados da API com sucesso!');
    } catch (error) {
        console.warn("⚠️ API offline, usando dados mockados:", error);
        // Usa dados mockados com filtros aplicados
        const dadosFiltrados = filtrarDadosMockados(corp, reg);
        
        atualizarKPIs(dadosFiltrados);
        renderizarMapaMarcadores(dadosFiltrados);
        renderizarGraficosPrincipais(dadosFiltrados);
        
        // Gráficos de ocorrências (estáticos por enquanto)
        renderizarGraficosOcorrencias();
        renderizarGraficosOcorrenciasPorTipo();
        
        console.log(`📊 Dados mockados carregados: ${dadosFiltrados.length} unidades`);
    }
}

// ==========================================
// 5. RENDERIZAÇÃO DE DADOS (GRÁFICOS E KPIS)
// ==========================================
function atualizarKPIs(dados) {
    const totalBat = document.getElementById('total_batalhoes');
    const totalEf = document.getElementById('total_efetivo');

    if(totalBat) totalBat.textContent = dados.length;
    if(totalEf) {
        const soma = dados.reduce((acc, curr) => acc + (curr.efetivo || 0), 0);
        totalEf.textContent = soma.toLocaleString('pt-BR');
    }
}

function renderizarMapaMarcadores(dados) {
    if (!AppState.layers.batalhoes) return;
    AppState.layers.batalhoes.clearLayers();
    
    dados.forEach(u => {
        const cor = CORES[u.corporacao] || '#333';
        const marker = L.circleMarker([u.latitude, u.longitude], {
            color: cor, 
            fillColor: cor, 
            fillOpacity: 0.8, 
            radius: 7, 
            weight: 2
        }).bindPopup(`
            <strong>${u.nome}</strong><br>
            Força: ${u.corporacao}<br>
            Regional: ${u.regional}<br>
            Efetivo: ${u.efetivo.toLocaleString('pt-BR')}
        `);
        
        marker.addTo(AppState.layers.batalhoes);
    });
}

function renderizarGraficosPrincipais(dados) {
    const contagem = { 
        'PM': { unid: 0, ef: 0 }, 
        'CBM': { unid: 0, ef: 0 }, 
        'GM': { unid: 0, ef: 0 } 
    };
    
    dados.forEach(u => {
        if(contagem[u.corporacao]) {
            contagem[u.corporacao].unid++;
            contagem[u.corporacao].ef += (u.efetivo || 0);
        }
    });

    // Gráfico de Barras - Unidades
    const ctxUnid = document.getElementById('bar_chart_unidades');
    if (ctxUnid) {
        if (AppState.charts.unidades) AppState.charts.unidades.destroy();
        AppState.charts.unidades = new Chart(ctxUnid, {
            type: 'bar',
            data: {
                labels: ['Polícia Militar', 'Bombeiros', 'Guarda Municipal'],
                datasets: [{
                    label: 'Unidades Ativas',
                    data: [contagem.PM.unid, contagem.CBM.unid, contagem.GM.unid],
                    backgroundColor: [CORES.PM, CORES.CBM, CORES.GM],
                    borderRadius: 8,
                    barPercentage: 0.7
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { display: false },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.raw} unidades` } }
                },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    }

    // Gráfico de Rosca - Efetivo
    const ctxEf = document.getElementById('doughnut_efetivo');
    if (ctxEf) {
        if (AppState.charts.efetivo) AppState.charts.efetivo.destroy();
        AppState.charts.efetivo = new Chart(ctxEf, {
            type: 'doughnut',
            data: {
                labels: ['PM', 'CBM', 'GM'],
                datasets: [{
                    data: [contagem.PM.ef, contagem.CBM.ef, contagem.GM.ef],
                    backgroundColor: [CORES.PM, CORES.CBM, CORES.GM],
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverOffset: 10
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const percent = ((ctx.raw / total) * 100).toFixed(1);
                                return `${ctx.label}: ${ctx.raw.toLocaleString('pt-BR')} (${percent}%)`;
                            }
                        }
                    },
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}

function renderizarGraficosOcorrencias() {
    const ctxRegiao = document.getElementById('bar_ocorrencias_regiao');
    
    if (ctxRegiao) {
        if (AppState.charts.ocorrenciasRegiao) AppState.charts.ocorrenciasRegiao.destroy();
        AppState.charts.ocorrenciasRegiao = new Chart(ctxRegiao, {
            type: 'bar',
            data: {
                labels: MOCK_OCORRENCIAS_REGIAO.labels,
                datasets: [{
                    label: 'Ocorrências',
                    data: MOCK_OCORRENCIAS_REGIAO.dados,
                    backgroundColor: '#008959',
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: '#006644'
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { position: 'top' },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.raw} ocorrências` } }
                },
                scales: { y: { beginAtZero: true, title: { display: true, text: 'Número de Ocorrências' } } }
            }
        });
    }
}

// NOVO: Gráfico de ocorrências por período
function renderizarGraficosOcorrenciasPorPeriodo() {
    const ctxPeriodo = document.getElementById('radar_ocorrencias_periodo');
    
    if (ctxPeriodo) {
        if (AppState.charts.ocorrenciasPeriodo) AppState.charts.ocorrenciasPeriodo.destroy();
        AppState.charts.ocorrenciasPeriodo = new Chart(ctxPeriodo, {
            type: 'line',
            data: {
                labels: MOCK_OCORRENCIAS_PERIODO.labels,
                datasets: [{
                    label: 'Ocorrências por Período',
                    data: MOCK_OCORRENCIAS_PERIODO.dados,
                    borderColor: CORES.orange,
                    backgroundColor: 'rgba(230, 81, 0, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: CORES.orange,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { 
                    legend: { position: 'top' },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.raw} ocorrências` } }
                },
                scales: { y: { beginAtZero: true, title: { display: true, text: 'Número de Ocorrências' } } }
            }
        });
    }
}

// NOVO: Gráfico de ocorrências por tipo
function renderizarGraficosOcorrenciasPorTipo() {
    const ctxTipo = document.getElementById('bar_ocorrencias_tipo');
    
    if (ctxTipo) {
        if (AppState.charts.ocorrenciasTipo) AppState.charts.ocorrenciasTipo.destroy();
        AppState.charts.ocorrenciasTipo = new Chart(ctxTipo, {
            type: 'bar',
            data: {
                labels: MOCK_OCORRENCIAS_TIPO.labels,
                datasets: [{
                    label: 'Ocorrências por Tipo',
                    data: MOCK_OCORRENCIAS_TIPO.dados,
                    backgroundColor: '#1976d2',
                    borderRadius: 6
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true, title: { display: true, text: 'Número de Ocorrências' } } }
            }
        });
    }
}

// Exportar para uso global se necessário
window.AppState = AppState;