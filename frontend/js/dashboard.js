/**
 * DASHBOARD.JS - Módulo de Gestão da Inteligência Operacional
 * Com DADOS MOCKADOS baseados no regionais.json
 */

const AppState = {
    map: null,
    layers: { batalhoes: null },
    charts: { 
        unidades: null, 
        efetivo: null, 
        ocorrenciasRegiao: null, 
        ocorrenciasPeriodo: null, 
        ocorrenciasTipo: null,
        evolucaoSemanal: null,
        resolucaoCorp: null,
        efetivoRegional: null
    }
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
    { id: 1, nome: '1ª Cia do 1°BBM (Bombeiros - Jacarecanga)', corporacao: 'CBM', regional: 'SER I', latitude: -3.722, longitude: -38.541, efetivo: 50 },
    { id: 2, nome: 'Batalhão de Segurança Patrimonial (BSP)', corporacao: 'PM', regional: 'SER I', latitude: -3.724, longitude: -38.543, efetivo: 90 },
    { id: 3, nome: '20º BPM (Cristo Redentor)', corporacao: 'PM', regional: 'SER I', latitude: -3.715, longitude: -38.565, efetivo: 210 },
    { id: 4, nome: 'Torre GM Goiabeiras (Barra do Ceará)', corporacao: 'GM', regional: 'SER I', latitude: -3.705, longitude: -38.580, efetivo: 12 },
    { id: 5, nome: 'Torre GM Vila Velha', corporacao: 'GM', regional: 'SER I', latitude: -3.722, longitude: -38.595, efetivo: 12 },
    { id: 6, nome: 'Torre GM Barra do Ceará', corporacao: 'GM', regional: 'SER I', latitude: -3.706, longitude: -38.583, efetivo: 12 },
    { id: 7, nome: 'Batalhão de Policiamento Turístico (BPTUR)', corporacao: 'PM', regional: 'SER II', latitude: -3.726, longitude: -38.498, efetivo: 180 },
    { id: 8, nome: '1ª CPG - Casa Militar', corporacao: 'PM', regional: 'SER II', latitude: -3.727, longitude: -38.496, efetivo: 60 },
    { id: 9, nome: '8º BPM (Aldeota)', corporacao: 'PM', regional: 'SER II', latitude: -3.738, longitude: -38.502, efetivo: 240 },
    { id: 10, nome: '22º BPM (Papicu)', corporacao: 'PM', regional: 'SER II', latitude: -3.736, longitude: -38.480, efetivo: 190 },
    { id: 11, nome: '2ª CPG - Assembleia Legislativa', corporacao: 'PM', regional: 'SER II', latitude: -3.745, longitude: -38.499, efetivo: 50 },
    { id: 12, nome: 'BSMar (Cais do Porto)', corporacao: 'CBM', regional: 'SER II', latitude: -3.718, longitude: -38.475, efetivo: 60 },
    { id: 13, nome: 'CPChoque / COTAM / BOPE', corporacao: 'PM', regional: 'SER II', latitude: -3.746, longitude: -38.461, efetivo: 450 },
    { id: 14, nome: 'Torre GM Caça e Pesca', corporacao: 'GM', regional: 'SER II', latitude: -3.738, longitude: -38.448, efetivo: 12 },
    { id: 15, nome: 'Torre GM Vicente Pinzon', corporacao: 'GM', regional: 'SER II', latitude: -3.733, longitude: -38.471, efetivo: 12 },
    { id: 16, nome: 'Torre GM Iracema', corporacao: 'GM', regional: 'SER II', latitude: -3.722, longitude: -38.516, efetivo: 12 },
    { id: 17, nome: 'CPRAIO (São Gerardo)', corporacao: 'PM', regional: 'SER III', latitude: -3.732, longitude: -38.555, efetivo: 320 },
    { id: 18, nome: '18º BPM (Antônio Bezerra)', corporacao: 'PM', regional: 'SER III', latitude: -3.736, longitude: -38.580, efetivo: 200 },
    { id: 19, nome: 'Torre GM Bonsucesso', corporacao: 'GM', regional: 'SER III', latitude: -3.766, longitude: -38.578, efetivo: 12 },
    { id: 20, nome: 'Comando de Bombeiro da Capital (CBC)', corporacao: 'CBM', regional: 'SER IV', latitude: -3.753, longitude: -38.533, efetivo: 90 },
    { id: 21, nome: '1º BBM (Parreão)', corporacao: 'CBM', regional: 'SER IV', latitude: -3.7535, longitude: -38.5335, efetivo: 110 },
    { id: 22, nome: '6º BPM (Parangaba)', corporacao: 'PM', regional: 'SER IV', latitude: -3.770, longitude: -38.560, efetivo: 230 },
    { id: 23, nome: 'Inspetoria GOE (Gentilândia)', corporacao: 'GM', regional: 'SER IV', latitude: -3.748, longitude: -38.536, efetivo: 45 },
    { id: 24, nome: '5ª Cia do 1º BBM (Conjunto Ceará)', corporacao: 'CBM', regional: 'SER V', latitude: -3.765, longitude: -38.600, efetivo: 55 },
    { id: 25, nome: '17º BPM (Conjunto Ceará)', corporacao: 'PM', regional: 'SER V', latitude: -3.768, longitude: -38.605, efetivo: 210 },
    { id: 26, nome: 'Torre GM Canindezinho', corporacao: 'GM', regional: 'SER V', latitude: -3.799, longitude: -38.601, efetivo: 12 },
    { id: 27, nome: 'Regimento de Polícia Montada (RPMONT)', corporacao: 'PM', regional: 'SER VI', latitude: -3.808, longitude: -38.485, efetivo: 150 },
    { id: 28, nome: '16º BPM (Messejana)', corporacao: 'PM', regional: 'SER VI', latitude: -3.832, longitude: -38.492, efetivo: 240 },
    { id: 29, nome: 'Torre GM Jangurussu', corporacao: 'GM', regional: 'SER VI', latitude: -3.834, longitude: -38.513, efetivo: 12 },
    { id: 30, nome: 'Torre GM Pôr do Sol', corporacao: 'GM', regional: 'SER VI', latitude: -3.818, longitude: -38.487, efetivo: 12 },
    { id: 31, nome: 'Inspetoria IPAM (Itaperi)', corporacao: 'GM', regional: 'SER VI', latitude: -3.791, longitude: -38.542, efetivo: 35 },
    { id: 32, nome: 'Batalhão de Busca e Salvamento (BBS)', corporacao: 'CBM', regional: 'Centro', latitude: -3.720, longitude: -38.535, efetivo: 80 },
    { id: 33, nome: '5º BPM (Centro)', corporacao: 'PM', regional: 'Centro', latitude: -3.730, longitude: -38.527, efetivo: 250 },
    { id: 34, nome: 'Inspetoria GTAM (Centro)', corporacao: 'GM', regional: 'Centro', latitude: -3.728, longitude: -38.533, efetivo: 40 },
    { id: 35, nome: 'Inspetoria GCICLO (Centro)', corporacao: 'GM', regional: 'Centro', latitude: -3.734, longitude: -38.524, efetivo: 35 }
];

// Dados de ocorrências por região (baseado no regionais.json)
const MOCK_OCORRENCIAS_REGIAO = {
    labels: ['SER I', 'SER II', 'SER III', 'SER IV', 'SER V', 'SER VI', 'Centro'],
    dados: [245, 312, 428, 189, 267, 150, 206]
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

// Dados para Evolução Semanal
const MOCK_EVOLUCAO_SEMANAL = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    dados: [45, 52, 38, 65, 89, 110, 95]
};

// Dados de Resolução por Corporação (%)
const MOCK_RESOLUCAO_CORP = {
    labels: ['PM', 'CBM', 'GM'],
    dados: [82, 95, 78]
};

document.addEventListener('DOMContentLoaded', () => {
    const usuario = validarAcesso();
    if(usuario) {
        configurarInterface(usuario);
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
        const regionais = ['todas', 'SER I', 'SER II', 'SER III', 'SER IV', 'SER V', 'SER VI', 'Centro'];
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
        renderizarGraficosOcorrenciasPorPeriodo();
        renderizarGraficosSecundarios(dados);
        
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
        renderizarGraficosOcorrenciasPorPeriodo();
        renderizarGraficosSecundarios(dadosFiltrados);
        
        console.log(`📊 Dados mockados carregados: ${dadosFiltrados.length} unidades`);
    }
}

// ==========================================
// 5. RENDERIZAÇÃO DE DADOS (GRÁFICOS E KPIS)
// ==========================================
function atualizarKPIs(dados) {
    const totalBat = document.getElementById('total_batalhoes');
    const totalEf = document.getElementById('total_efetivo');
    const totalOcorrencias = document.getElementById('total_ocorrencias');
    const tempoMedio = document.getElementById('tempo_medio');

    if(totalBat) totalBat.textContent = dados.length;
    if(totalEf) {
        const soma = dados.reduce((acc, curr) => acc + (curr.efetivo || 0), 0);
        totalEf.textContent = soma.toLocaleString('pt-BR');
    }
    if(totalOcorrencias) {
        // Utilizando a soma do mock de ocorrências por região
        const somaOcorrencias = MOCK_OCORRENCIAS_REGIAO.dados.reduce((a, b) => a + b, 0);
        totalOcorrencias.textContent = somaOcorrencias.toLocaleString('pt-BR');
    }
    if(tempoMedio) {
        // Mantendo o tempo médio formatado dinamicamente
        tempoMedio.innerHTML = `8<span class="kpi_unit">min</span>`;
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

// ==========================================
// 6. GRÁFICOS SECUNDÁRIOS
// ==========================================
function renderizarGraficosSecundarios(dados) {
    // 1. Evolução Semanal (Linha)
    const ctxEvolucao = document.getElementById('line_evolucao_semanal');
    if (ctxEvolucao) {
        if (AppState.charts.evolucaoSemanal) AppState.charts.evolucaoSemanal.destroy();
        AppState.charts.evolucaoSemanal = new Chart(ctxEvolucao, {
            type: 'line',
            data: {
                labels: MOCK_EVOLUCAO_SEMANAL.labels,
                datasets: [{
                    label: 'Ocorrências Registradas',
                    data: MOCK_EVOLUCAO_SEMANAL.dados,
                    borderColor: CORES.green,
                    backgroundColor: 'rgba(0, 137, 89, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: CORES.green
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // 2. Resolução por Corporação (Doughnut)
    const ctxResolucao = document.getElementById('doughnut_resolucao_corp');
    if (ctxResolucao) {
        if (AppState.charts.resolucaoCorp) AppState.charts.resolucaoCorp.destroy();
        AppState.charts.resolucaoCorp = new Chart(ctxResolucao, {
            type: 'doughnut',
            data: {
                labels: MOCK_RESOLUCAO_CORP.labels,
                datasets: [{
                    data: MOCK_RESOLUCAO_CORP.dados,
                    backgroundColor: [CORES.PM, CORES.CBM, CORES.GM],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { 
                    legend: { position: 'bottom' },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw}% de resolução` } }
                }
            }
        });
    }

    // 3. Efetivo por Regional (Dinâmico, responde aos filtros)
    const ctxEfetivoReg = document.getElementById('bar_efetivo_regional');
    if (ctxEfetivoReg) {
        const contagemRegional = {};
        // Inicializa as regionais conhecidas para manter a ordem visual
        ['SER I', 'SER II', 'SER III', 'SER IV', 'SER V', 'SER VI', 'Centro'].forEach(r => contagemRegional[r] = 0);
        
        dados.forEach(u => {
            const r = u.regional || 'Outros';
            if(contagemRegional[r] !== undefined) contagemRegional[r] += (u.efetivo || 0);
            else contagemRegional[r] = (u.efetivo || 0);
        });

        if (AppState.charts.efetivoRegional) AppState.charts.efetivoRegional.destroy();
        AppState.charts.efetivoRegional = new Chart(ctxEfetivoReg, {
            type: 'bar',
            data: {
                labels: Object.keys(contagemRegional),
                datasets: [{
                    label: 'Efetivo Alocado',
                    data: Object.values(contagemRegional),
                    backgroundColor: CORES.PM,
                    borderRadius: 5
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }
}

// Exportar para uso global se necessário
window.AppState = AppState;