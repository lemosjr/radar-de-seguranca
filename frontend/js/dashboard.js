/* ============================================================
   VARIÁVEIS GLOBAIS DE GRÁFICOS E MAPA
   ============================================================ */
let graficoUnidades     = null;
let graficoEfetivo      = null;
let graficoOcorrRegiao  = null;
let graficoOcorrPeriodo = null;
let map                 = null;
let camadaBatalhoes     = null;

const coresRegionais  = ["#f8bbd0","#e1f5fe","#fff9c4","#e1bee7","#ffccbc","#c8e6c9","#ffe0b2"];

/* ---- DADOS MOCKADOS (FALLBACK CASO A API ESTEJA OFFLINE) ---- */
const DADOS_MOCKADOS_OFFLINE = [
    { nome:'1º CRPM / 5º BPM', corporacao:'PM', regional:'Centro', latitude:-3.728330, longitude:-38.528330, efetivo:250, status:'ativo' },
    { nome:'8º BPM (Aldeota)', corporacao:'PM', regional:'SER II', latitude:-3.738050, longitude:-38.502220, efetivo:200, status:'ativo' },
    { nome:'CPChoque / COTAM', corporacao:'PM', regional:'SER II', latitude:-3.746110, longitude:-38.461660, efetivo:400, status:'alerta' },
    { nome:'CPRAIO', corporacao:'PM', regional:'SER III', latitude:-3.734720, longitude:-38.553330, efetivo:300, status:'ativo' },
    { nome:'1ª Cia / 1º BBM (Jacarecanga)', corporacao:'CBM', regional:'SER I', latitude:-3.725000, longitude:-38.541000, efetivo:40, status:'ativo' },
    { nome:'Comando Geral BBM (Parreão)', corporacao:'CBM', regional:'SER IV', latitude:-3.753000, longitude:-38.533000, efetivo:80, status:'ativo' },
    { nome:'3ª Cia / 1º BBM (Messejana)', corporacao:'CBM', regional:'SER VI', latitude:-3.832000, longitude:-38.498000, efetivo:40, status:'inativo'},
    { nome:'Torre GM Lagoinha', corporacao:'GM', regional:'Centro', latitude:-3.726000, longitude:-38.530000, efetivo:15, status:'ativo' },
    { nome:'Torre GM Beira Mar', corporacao:'GM', regional:'SER II', latitude:-3.728000, longitude:-38.498000, efetivo:15, status:'ativo' },
    { nome:'Torre GM Jangurussu', corporacao:'GM', regional:'SER VI', latitude:-3.831000, longitude:-38.508000, efetivo:15, status:'alerta' }
];

const OCORRENCIAS_MOCKADAS = {
    porRegiao: {
        labels: ['Centro','SER I','SER II','SER III','SER IV','SER V','SER VI'],
        dados:  [142, 89, 213, 97, 76, 54, 118]
    },
    porPeriodo: {
        labels: ['Madrugada\n00–06h','Manhã\n06–12h','Tarde\n12–18h','Noite\n18–00h'],
        dados:  [187, 134, 198, 270]
    }
};

/* ============================================================
   INICIALIZAÇÃO SEGURA DO SISTEMA
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. ROUTE GUARD (Proteção de Rota) ---
    const usuarioString = localStorage.getItem('usuario');
    
    if (!usuarioString) {
        window.location.href = 'login.html';
        return; // Interrompe a execução se não houver login
    }

    const usuarioDash = JSON.parse(usuarioString);

    // --- 2. INJEÇÃO DE DADOS NO CABEÇALHO ---
    const primeiroNome = usuarioDash.nome.split(' ')[0];
    const elUserName = document.getElementById('dash_user_name');
    const elUserRole = document.getElementById('dash_user_role');
    const elUserInitials = document.getElementById('dash_user_initials');
    const btnLogout = document.getElementById('btn_logout_dash');

    if(elUserName) elUserName.textContent = primeiroNome;
    if(elUserRole) elUserRole.textContent = `${usuarioDash.tipo_militar} | ${usuarioDash.nivel_acesso}`;

    // Lógica das Iniciais do Avatar
    const partesNome = usuarioDash.nome.trim().split(' ');
    let iniciais = '';
    if (partesNome.length > 1) {
        iniciais = partesNome[0].charAt(0) + partesNome[partesNome.length - 1].charAt(0);
    } else {
        iniciais = usuarioDash.nome.substring(0, 2);
    }
    if(elUserInitials) elUserInitials.textContent = iniciais.toUpperCase();

    // Botão de Logout Seguro
    if(btnLogout) {
        btnLogout.addEventListener('click', () => {
            if(confirm('Tem certeza que deseja encerrar sua sessão no sistema de monitoramento?')) {
                localStorage.removeItem('usuario');
                window.location.href = 'login.html';
            }
        });
    }

    // --- 3. CONTROLO DO MENU LATERAL (SIDEBAR) ---
    const btnMenu = document.getElementById('hamburger');
    const closeBtn = document.getElementById('sidebar_close');
    const sidebar = document.getElementById('sidebar_nav');
    const overlay = document.getElementById('nav_overlay');

    function toggleMenu(forceClose = false) {
        if (!sidebar) return;
        const isOpen = sidebar.classList.contains('is_open');
        
        if (isOpen || forceClose) {
            sidebar.classList.remove('is_open');
            if(overlay) overlay.classList.remove('is_visible');
            if(btnMenu) btnMenu.setAttribute('aria-expanded', 'false');
            sidebar.setAttribute('aria-hidden', 'true');
        } else {
            sidebar.classList.add('is_open');
            if(overlay) overlay.classList.add('is_visible');
            if(btnMenu) btnMenu.setAttribute('aria-expanded', 'true');
            sidebar.setAttribute('aria-hidden', 'false');
        }
    }

    if(btnMenu) btnMenu.addEventListener('click', () => toggleMenu());
    if(closeBtn) closeBtn.addEventListener('click', () => toggleMenu(true));
    if(overlay) overlay.addEventListener('click', () => toggleMenu(true));
    
    // Fechar menu com a tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') toggleMenu(true);
    });

    // --- 4. INICIAR DASHBOARD (MAPAS E GRÁFICOS) ---
    initMapAndCharts();
});

/* ============================================================
   LÓGICA PRINCIPAL DO DASHBOARD
   ============================================================ */
async function initMapAndCharts() {
    // Inicializa o Mapa Leaflet
    map = L.map('map_wrapper').setView([-3.7327, -38.5270], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    camadaBatalhoes = L.layerGroup().addTo(map);

    try {
        const responseGeo = await fetch('/frontend/data/regionais.json');
        const geoData = await responseGeo.json();

        let indexCor = 0;
        L.geoJSON(geoData, {
            style: function (feature) {
                const color = coresRegionais[indexCor++ % coresRegionais.length];
                return { color:"#008959", weight:2, fillColor:color, fillOpacity:0.4 };
            },
            onEachFeature: function (feature, layer) {
                layer.bindPopup(`<b>${feature.properties.nome || "Regional"}</b>`);
            }
        }).addTo(map);

        popularFiltroRegionais(geoData);
        setTimeout(() => { map.invalidateSize(); }, 500);

    } catch (error) {
        console.warn("Regionais.json não encontrado ou erro ao carregar geodados.");
    }

    // Carrega dados iniciais
    await loadBatalhoes('todas', 'todas', 'todos', 'todos');
    renderizarGraficosOcorrencias();
    configurarFiltros();
}

/* ==========================================
   BUSCA DE UNIDADES E RENDERIZAÇÃO
========================================== */
async function loadBatalhoes(corporacao, regional, turno, status) {
    camadaBatalhoes.clearLayers();
    let unidades = [];

    try {
        const url = `http://localhost:3000/api/unidades?corporacao=${corporacao}&regional=${regional}&turno=${turno}&status=${status}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("API indisponível");
        unidades = await response.json();
    } catch (err) {
        console.warn("API offline — usando dados mockados de fallback.");
        unidades = DADOS_MOCKADOS_OFFLINE.filter(u => {
            const passaCorp   = (corporacao === 'todas' || u.corporacao === corporacao);
            const passaReg    = (regional   === 'todas' || u.regional   === regional);
            const passaStatus = (status     === 'todos' || u.status     === status);
            return passaCorp && passaReg && passaStatus;
        });
    }

    /* Atualização de KPIs */
    const kpiBatalhoes = document.getElementById("total_batalhoes");
    const kpiEfetivo   = document.getElementById("total_efetivo");

    if (kpiBatalhoes) kpiBatalhoes.innerText = unidades.length;

    const totalEfetivo = unidades.reduce((sum, b) => sum + Number(b.efetivo), 0);
    if (kpiEfetivo) kpiEfetivo.innerText = totalEfetivo.toLocaleString('pt-BR');

    /* Renderização de Marcadores no Mapa */
    unidades.forEach(uni => {
        let cor = '#fbc02d'; // Default GM
        if (uni.corporacao === 'PM')  cor = '#1976d2';
        if (uni.corporacao === 'CBM') cor = '#d32f2f';

        const borderColor = uni.status === 'alerta' ? '#E65100' : '#ffffff';
        const borderWidth = uni.status === 'alerta' ? 3 : 2;

        const marker = L.circleMarker([uni.latitude, uni.longitude], {
            radius: 8, fillColor: cor, color: borderColor, weight: borderWidth, fillOpacity: 1
        });

        marker.bindPopup(`
            <div style="text-align:center;min-width:160px; font-family: sans-serif;">
                <strong style="color:${cor};font-size:13px; text-transform: uppercase;">${uni.nome}</strong><br>
                <span style="font-size:11px;color:#aaa;">Corporação:</span> <strong>${uni.corporacao}</strong><br>
                <span style="font-size:11px;color:#aaa;">Efetivo:</span> <strong>${uni.efetivo} agentes</strong><br>
                <span style="font-size:11px;color:#aaa;">Status:</span>
                <strong style="color:${uni.status==='alerta'?'#E65100':uni.status==='inativo'?'#888':'#4caf50'}; text-transform: uppercase;">
                  ${uni.status}
                </strong>
            </div>
        `);

        marker.addTo(camadaBatalhoes);
    });

    atualizarGraficosUnidades(unidades);
}

/* ==========================================
   GESTÃO DE FILTROS
========================================== */
function configurarFiltros() {
    const idsFiltros = ['corporation', 'regional', 'turno', 'status'];
    
    idsFiltros.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('change', aplicarFiltros);
    });

    const btnReset = document.getElementById('btn_reset');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            idsFiltros.forEach(id => {
                const el = document.getElementById(id);
                if(el) el.selectedIndex = 0;
            });
            loadBatalhoes('todas','todas','todos','todos');
        });
    }
}

function aplicarFiltros() {
    const corp   = document.getElementById('corporation')?.value || 'todas';
    const reg    = document.getElementById('regional')?.value || 'todas';
    const turno  = document.getElementById('turno')?.value || 'todos';
    const status = document.getElementById('status')?.value || 'todos';
    loadBatalhoes(corp, reg, turno, status);
}

function popularFiltroRegionais(geoData) {
    const select = document.getElementById('regional');
    if(!select) return;
    
    // Proteção: Se o HTML já tem as opções estáticas (mais de 1), não duplica.
    if (select.options.length > 1) return;
    
    geoData.features.map(f => f.properties.nome).filter(n => n).forEach(nome => {
        const option = document.createElement('option');
        option.value = nome;
        option.innerText = nome;
        select.appendChild(option);
    });
}

/* ==========================================
   GRÁFICOS: CHART.JS
========================================== */
function atualizarGraficosUnidades(unidades) {
    const contagem = { PM:0, CBM:0, GM:0 };
    const efetivo  = { PM:0, CBM:0, GM:0 };

    unidades.forEach(u => {
        if (contagem[u.corporacao] !== undefined) {
            contagem[u.corporacao] += 1;
            efetivo[u.corporacao]  += Number(u.efetivo);
        }
    });

    const labels = ['Polícia Militar','Bombeiros','Guarda Municipal'];
    const cores  = ['#1a237e','#b71c1c','#fbc02d']; // Cores atualizadas padrão SSPDS

    const ctxBar = document.getElementById('bar_chart_unidades');
    if (ctxBar) {
        if (graficoUnidades) graficoUnidades.destroy();
        graficoUnidades = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Unidades Ativas',
                    data: [contagem.PM, contagem.CBM, contagem.GM],
                    backgroundColor: cores,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero:true, ticks:{ stepSize:1 }, grid:{ color:'rgba(0,0,0,0.04)' } },
                    x: { grid:{ display:false } }
                }
            }
        });
    }

    const ctxDoughnut = document.getElementById('doughnut_efetivo');
    if (ctxDoughnut) {
        if (graficoEfetivo) graficoEfetivo.destroy();
        graficoEfetivo = new Chart(ctxDoughnut, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: [efetivo.PM, efetivo.CBM, efetivo.GM],
                    backgroundColor: cores,
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position:'bottom', labels:{ boxWidth:12, font:{ size:11 } } } },
                cutout: '65%'
            }
        });
    }
}

function renderizarGraficosOcorrencias() {
    const GREEN       = '#008959';
    const GREEN_LIGHT = 'rgba(0,137,89,0.15)';
    const ORANGE_BG   = ['rgba(251,191,36,0.9)', 'rgba(230,81,0,0.9)', 'rgba(191,54,12,0.9)', 'rgba(130,30,5,0.9)'];

    const ctxRegiao = document.getElementById('bar_ocorrencias_regiao');
    if (ctxRegiao) {
        if (graficoOcorrRegiao) graficoOcorrRegiao.destroy();
        const { labels, dados } = OCORRENCIAS_MOCKADAS.porRegiao;
        graficoOcorrRegiao = new Chart(ctxRegiao, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Ocorrências',
                    data: dados,
                    backgroundColor: GREEN_LIGHT,
                    borderColor: GREEN,
                    borderWidth: 1.5,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero:true, grid:{ color:'rgba(0,0,0,0.04)' } },
                    y: { grid:{ display:false } }
                }
            }
        });
    }

    const ctxPeriodo = document.getElementById('radar_ocorrencias_periodo');
    if (ctxPeriodo) {
        if (graficoOcorrPeriodo) graficoOcorrPeriodo.destroy();
        const { labels, dados } = OCORRENCIAS_MOCKADAS.porPeriodo;
        graficoOcorrPeriodo = new Chart(ctxPeriodo, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Ocorrências',
                    data: dados,
                    backgroundColor: ORANGE_BG,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero:true, grid:{ color:'rgba(0,0,0,0.04)' } },
                    x: { grid:{ display:false } }
                }
            }
        });
    }
}