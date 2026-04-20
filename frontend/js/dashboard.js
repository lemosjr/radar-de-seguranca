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
    AppState.layers.batalhoes.clearLayers();
    
    dados.forEach(u => {
        const cor = CORES[u.corporacao] || '#333';
        const marker = L.circleMarker([u.latitude, u.longitude], {
            color: cor, fillColor: cor, fillOpacity: 0.8, radius: 8, weight: 2
        }).bindPopup(`<strong>${u.nome}</strong><br>Força: ${u.corporacao}<br>Regional: ${u.regional}<br>Efetivo Estimado: ${u.efetivo}`);
        
        marker.addTo(AppState.layers.batalhoes);
    });
}

function renderizarGraficosPrincipais(dados) {
    // Conta os dados das unidades que vieram da API
    const contagem = { 'PM': { unid: 0, ef: 0 }, 'CBM': { unid: 0, ef: 0 }, 'GM': { unid: 0, ef: 0 } };
    dados.forEach(u => {
        if(contagem[u.corporacao]) {
            contagem[u.corporacao].unid++;
            contagem[u.corporacao].ef += (u.efetivo || 0);
        }
    });

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
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    const ctxEf = document.getElementById('doughnut_efetivo');
    if (ctxEf) {
        if (AppState.charts.efetivo) AppState.charts.efetivo.destroy();
        AppState.charts.efetivo = new Chart(ctxEf, {
            type: 'doughnut',
            data: {
                labels: ['PM', 'CBM', 'GM'],
                datasets: [{
                    data: [contagem.PM.ef, contagem.CBM.ef, contagem.GM.ef],
                    backgroundColor: [CORES.PM, CORES.CBM, CORES.GM]
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

function renderizarGraficosOcorrencias() {
    const ctxRegiao = document.getElementById('bar_ocorrencias_regiao');
    const ctxPeriodo = document.getElementById('radar_ocorrencias_periodo');

    if (ctxRegiao) {
        if (AppState.charts.ocorrenciasRegiao) AppState.charts.ocorrenciasRegiao.destroy();
        AppState.charts.ocorrenciasRegiao = new Chart(ctxRegiao, {
            type: 'bar',
            data: {
                labels: ['Centro', 'SER I', 'SER II', 'SER III', 'SER IV'],
                datasets: [{
                    label: 'Ocorrências',
                    data: [120, 190, 300, 150, 210],
                    backgroundColor: CORES.green, borderRadius: 4
                }]
            },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    if (ctxPeriodo) {
        if (AppState.charts.ocorrenciasPeriodo) AppState.charts.ocorrenciasPeriodo.destroy();
        AppState.charts.ocorrenciasPeriodo = new Chart(ctxPeriodo, {
            type: 'line',
            data: {
                labels: ['00h', '06h', '12h', '18h'],
                datasets: [{
                    label: 'Pico de Chamados',
                    data: [30, 45, 110, 95],
                    borderColor: CORES.orange, backgroundColor: 'rgba(230, 81, 0, 0.2)', fill: true, tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }
}