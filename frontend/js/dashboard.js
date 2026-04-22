/**
 * DASHBOARD.JS - Módulo de Gestão da Inteligência Operacional
 * Controla: Autenticação, Interface, Mapa Leaflet, Gráficos e Filtros da API
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

// DADOS MOCKADOS PARA TESTE
const MOCK_BATALHOES = [
    {
        id: 1,
        nome: '1º BPM',
        corporacao: 'PM',
        regional: 'Centro',
        latitude: -23.5505,
        longitude: -46.6333,
        efetivo: 450
    },
    {
        id: 2,
        nome: '2º BPM',
        corporacao: 'PM',
        regional: 'SER I',
        latitude: -23.5605,
        longitude: -46.6433,
        efetivo: 380
    },
    {
        id: 3,
        nome: '1º CBM',
        corporacao: 'CBM',
        regional: 'Centro',
        latitude: -23.5555,
        longitude: -46.6383,
        efetivo: 120
    },
    {
        id: 4,
        nome: '2º CBM',
        corporacao: 'CBM',
        regional: 'SER II',
        latitude: -23.5655,
        longitude: -46.6483,
        efetivo: 95
    },
    {
        id: 5,
        nome: '1ª GM',
        corporacao: 'GM',
        regional: 'Centro',
        latitude: -23.5455,
        longitude: -46.6283,
        efetivo: 200
    },
    {
        id: 6,
        nome: '3º BPM',
        corporacao: 'PM',
        regional: 'SER III',
        latitude: -23.5755,
        longitude: -46.6583,
        efetivo: 520
    },
    {
        id: 7,
        nome: '3º CBM',
        corporacao: 'CBM',
        regional: 'SER IV',
        latitude: -23.5855,
        longitude: -46.6683,
        efetivo: 88
    }
];

// DADOS MOCKADOS PARA OCORRÊNCIAS
const MOCK_OCORRENCIAS_REGIAO = {
    labels: ['Centro', 'SER I', 'SER II', 'SER III', 'SER IV'],
    dados: [120, 190, 300, 150, 210]
};

const MOCK_OCORRENCIAS_PERIODO = {
    labels: ['00h', '06h', '12h', '18h'],
    dados: [30, 45, 110, 95]
};

document.addEventListener('DOMContentLoaded', () => {
    const usuario = validarAcesso();
    if(usuario) {
        configurarInterface(usuario);
        configurarMenuLateral();
        configurarMapa();
        configurarFiltros();
        carregarDadosOperacionais(); // Dispara a busca no Back-end
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
    // Atualiza o Cabeçalho com os dados do usuário logado
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

    // Lógica de Logout do Cabeçalho
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
                    return {
                        fillColor: feature.properties.fill || '#00b37e',
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

// ==========================================
// 3. COMUNICAÇÃO COM A API E FILTROS
// ==========================================
function configurarFiltros() {
    const selectCorp = document.getElementById('corporation');
    const selectReg = document.getElementById('regional');
    const btnReset = document.getElementById('btn_reset');

    const atualizar = () => carregarDadosOperacionais(selectCorp.value, selectReg.value);
    
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
        const res = await fetch(`http://localhost:3000/api/unidades?corporacao=${corp}&regional=${reg}`);
        const dados = await res.json();
        
        atualizarKPIs(dados);
        renderizarMapaMarcadores(dados);
        renderizarGraficosPrincipais(dados);
        renderizarGraficosOcorrencias();
    } catch (error) {
        console.error("Erro na API, exibindo fallback visual:", error);
    }
}

// ==========================================
// 4. RENDERIZAÇÃO DE DADOS (GRÁFICOS E KPIS)
// ==========================================
function atualizarKPIs(dados = MOCK_BATALHOES) {
    const totalBat = document.getElementById('total_batalhoes');
    const totalEf = document.getElementById('total_efetivo');

    if(totalBat) totalBat.textContent = dados.length;
    if(totalEf) {
        const soma = dados.reduce((acc, curr) => acc + (curr.efetivo || 0), 0);
        totalEf.textContent = soma.toLocaleString('pt-BR');
    }
}

function renderizarMapaMarcadores(dados = MOCK_BATALHOES) {
    AppState.layers.batalhoes.clearLayers();
    
    dados.forEach(u => {
        const cor = CORES[u.corporacao] || '#333';
        const marker = L.circleMarker([u.latitude, u.longitude], {
            color: cor, fillColor: cor, fillOpacity: 0.8, radius: 5, weight: 1.5
        }).bindPopup(`<strong>${u.nome}</strong><br>Força: ${u.corporacao}<br>Regional: ${u.regional}<br>Efetivo Estimado: ${u.efetivo}`);
        
        marker.addTo(AppState.layers.batalhoes);
    });
}

function renderizarGraficosOcorrencias(dadosRegiao = MOCK_OCORRENCIAS_REGIAO, dadosPeriodo = MOCK_OCORRENCIAS_PERIODO) {
    const ctxRegiao = document.getElementById('bar_ocorrencias_regiao');
    const ctxPeriodo = document.getElementById('radar_ocorrencias_periodo');

    // Gráfico de Barras Horizontais - Ocorrências por Região
    if (ctxRegiao) {
        if (AppState.charts.ocorrenciasRegiao) AppState.charts.ocorrenciasRegiao.destroy();
        AppState.charts.ocorrenciasRegiao = new Chart(ctxRegiao, {
            type: 'bar',
            data: {
                labels: dadosRegiao.labels,
                datasets: [{
                    label: 'Ocorrências',
                    data: dadosRegiao.dados,
                    backgroundColor: CORES.green || 'rgba(76, 175, 80, 0.8)',
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: '#2e7d32'
                }]
            },
            options: { 
                indexAxis: 'y', 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.raw} ocorrências`
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Número de Ocorrências'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Região'
                        }
                    }
                }
            }
        });
    }

    // Gráfico de Linha - Ocorrências por Período
    if (ctxPeriodo) {
        if (AppState.charts.ocorrenciasPeriodo) AppState.charts.ocorrenciasPeriodo.destroy();
        AppState.charts.ocorrenciasPeriodo = new Chart(ctxPeriodo, {
            type: 'line',
            data: {
                labels: dadosPeriodo.labels,
                datasets: [{
                    label: 'Chamados por Período',
                    data: dadosPeriodo.dados,
                    borderColor: CORES.orange || '#e65100',
                    backgroundColor: 'rgba(230, 81, 0, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: CORES.orange || '#e65100',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { 
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            boxWidth: 10
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.raw} chamados`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Número de Chamados'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Horário'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// Função para simular carregamento de dados da API
async function carregarDadosMockados() {
    console.log('🔄 Carregando dados mockados...');
    
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Retorna os dados mockados
    return {
        batalhoes: MOCK_BATALHOES,
        ocorrencias: {
            regiao: MOCK_OCORRENCIAS_REGIAO,
            periodo: MOCK_OCORRENCIAS_PERIODO
        }
    };
}

// Exemplo de uso
async function inicializarDashboardComMock() {
    try {
        const dadosMock = await carregarDadosMockados();
        
        atualizarKPIs(dadosMock.batalhoes);
        renderizarMapaMarcadores(dadosMock.batalhoes);
        renderizarGraficosPrincipais(dadosMock.batalhoes);
        renderizarGraficosOcorrencias(
            dadosMock.ocorrencias.regiao, 
            dadosMock.ocorrencias.periodo
        );
        
        console.log('✅ Dashboard carregado com dados mockados');
    } catch (error) {
        console.error('❌ Erro ao carregar dados mockados:', error);
    }
}

// Chama a função quando a página carregar
document.addEventListener('DOMContentLoaded', inicializarDashboardComMock);