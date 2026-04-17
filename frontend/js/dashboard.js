/* ============================================================
   DASHBOARD — MAPA LEAFLET + FILTROS + CHART.JS
   ============================================================ */

let graficoUnidades     = null;
let graficoEfetivo      = null;
let graficoOcorrRegiao  = null;
let graficoOcorrPeriodo = null;

const map = L.map('map_wrapper').setView([-3.7327, -38.5270], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

const coresRegionais  = ["#f8bbd0","#e1f5fe","#fff9c4","#e1bee7","#ffccbc","#c8e6c9","#ffe0b2"];
const camadaBatalhoes = L.layerGroup().addTo(map);

/* ---- DADOS MOCKADOS — UNIDADES ---- */
const DADOS_MOCKADOS_OFFLINE = [
    { nome:'1º CRPM / 5º BPM',            corporacao:'PM',  regional:'Centro',  latitude:-3.728330, longitude:-38.528330, efetivo:250, status:'ativo'  },
    { nome:'8º BPM (Aldeota)',             corporacao:'PM',  regional:'SER II',  latitude:-3.738050, longitude:-38.502220, efetivo:200, status:'ativo'  },
    { nome:'CPChoque / COTAM',             corporacao:'PM',  regional:'SER II',  latitude:-3.746110, longitude:-38.461660, efetivo:400, status:'alerta' },
    { nome:'CPRAIO',                       corporacao:'PM',  regional:'SER III', latitude:-3.734720, longitude:-38.553330, efetivo:300, status:'ativo'  },
    { nome:'1ª Cia / 1º BBM (Jacarecang)',corporacao:'CBM', regional:'SER I',   latitude:-3.725000, longitude:-38.541000, efetivo:40,  status:'ativo'  },
    { nome:'Comando Geral BBM (Parreão)', corporacao:'CBM', regional:'SER IV',  latitude:-3.753000, longitude:-38.533000, efetivo:80,  status:'ativo'  },
    { nome:'3ª Cia / 1º BBM (Messejana)',corporacao:'CBM', regional:'SER VI',  latitude:-3.832000, longitude:-38.498000, efetivo:40,  status:'inativo'},
    { nome:'Torre GM Lagoinha',            corporacao:'GM',  regional:'Centro',  latitude:-3.726000, longitude:-38.530000, efetivo:15,  status:'ativo'  },
    { nome:'Torre GM Beira Mar',           corporacao:'GM',  regional:'SER II',  latitude:-3.728000, longitude:-38.498000, efetivo:15,  status:'ativo'  },
    { nome:'Torre GM Jangurussu',          corporacao:'GM',  regional:'SER VI',  latitude:-3.831000, longitude:-38.508000, efetivo:15,  status:'alerta' }
];

/* ---- DADOS MOCKADOS — OCORRÊNCIAS ---- */
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

/* ==========================================
   INICIALIZAÇÃO
========================================== */
async function initDashboard() {
    try {
        const responseGeo = await fetch('/frontend/data/regionais.json');
        const geoData     = await responseGeo.json();

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

        const statusDiv = document.getElementById("map_status");
        if (statusDiv) statusDiv.remove();

        popularFiltroRegionais(geoData);
        setTimeout(() => { map.invalidateSize(); }, 500);

    } catch (error) {
        console.error("Erro ao carregar regionais.json:", error);
    }

    await loadBatalhoes('todas', 'todas', 'todos', 'todos');
    renderizarGraficosOcorrencias();
    configurarBotaoReset();
}

/* ==========================================
   BUSCA DE UNIDADES (COM FALLBACK OFFLINE)
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
        console.warn("API offline — usando dados mockados.");
        unidades = DADOS_MOCKADOS_OFFLINE.filter(u => {
            const passaCorp   = (corporacao === 'todas' || u.corporacao === corporacao);
            const passaReg    = (regional   === 'todas' || u.regional   === regional);
            const passaStatus = (status     === 'todos' || u.status     === status);
            /* turno não é uma prop da unidade, seria aplicado nas ocorrências */
            return passaCorp && passaReg && passaStatus;
        });
    }

    /* KPIs */
    const kpiBatalhoes = document.getElementById("total_batalhoes");
    const kpiEfetivo   = document.getElementById("total_efetivo");

    if (kpiBatalhoes) kpiBatalhoes.innerText = unidades.length;

    const totalEfetivo = unidades.reduce((sum, b) => sum + Number(b.efetivo), 0);
    if (kpiEfetivo) kpiEfetivo.innerText = totalEfetivo.toLocaleString('pt-BR');

    /* Markers no mapa */
    unidades.forEach(uni => {
        let cor = '#fbc02d';
        if (uni.corporacao === 'PM')  cor = '#1976d2';
        if (uni.corporacao === 'CBM') cor = '#d32f2f';

        /* Borda laranja para unidades em alerta */
        const borderColor = uni.status === 'alerta' ? '#E65100' : '#ffffff';
        const borderWidth = uni.status === 'alerta' ? 3 : 2;

        const marker = L.circleMarker([uni.latitude, uni.longitude], {
            radius: 8, fillColor: cor, color: borderColor, weight: borderWidth, fillOpacity: 1
        });

        marker.bindPopup(`
            <div style="text-align:center;min-width:160px;">
                <strong style="color:${cor};font-size:13px;">${uni.nome}</strong><br>
                <span style="font-size:11px;color:#aaa;">Corporação:</span> ${uni.corporacao}<br>
                <span style="font-size:11px;color:#aaa;">Efetivo:</span> ${uni.efetivo} agentes<br>
                <span style="font-size:11px;color:#aaa;">Status:</span>
                <span style="color:${uni.status==='alerta'?'#E65100':uni.status==='inativo'?'#888':'#4caf50'};">
                  ${uni.status.charAt(0).toUpperCase()+uni.status.slice(1)}
                </span>
            </div>
        `);

        marker.addTo(camadaBatalhoes);
    });

    atualizarGraficosUnidades(unidades);
}

/* ==========================================
   FILTROS
========================================== */
document.getElementById('corporation').addEventListener('change', aplicarFiltros);
document.getElementById('regional').addEventListener('change', aplicarFiltros);
document.getElementById('turno').addEventListener('change', aplicarFiltros);
document.getElementById('status').addEventListener('change', aplicarFiltros);

function aplicarFiltros() {
    const corp   = document.getElementById('corporation').value;
    const reg    = document.getElementById('regional').value;
    const turno  = document.getElementById('turno').value;
    const status = document.getElementById('status').value;
    loadBatalhoes(corp, reg, turno, status);
}

function configurarBotaoReset() {
    const btn = document.getElementById('btn_reset');
    if (!btn) return;
    btn.addEventListener('click', () => {
        ['corporation','regional','turno','status'].forEach(id => {
            document.getElementById(id).selectedIndex = 0;
        });
        loadBatalhoes('todas','todas','todos','todos');
    });
}

function popularFiltroRegionais(geoData) {
    const select = document.getElementById('regional');
    geoData.features.map(f => f.properties.nome).filter(n => n).forEach(nome => {
        const option     = document.createElement('option');
        option.value     = nome;
        option.innerText = nome;
        select.appendChild(option);
    });
}

/* ==========================================
   GRÁFICOS — UNIDADES E EFETIVO
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
    const cores  = ['#1976d2','#d32f2f','#fbc02d'];

    const ctxBar = document.getElementById('bar_chart_unidades');
    if (ctxBar) {
        if (graficoUnidades) graficoUnidades.destroy();
        graficoUnidades = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Bases/Quartéis Ativos',
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
                cutout: '62%'
            }
        });
    }
}

/* ==========================================
   GRÁFICOS — OCORRÊNCIAS
========================================== */
function renderizarGraficosOcorrencias() {
    const GREEN       = '#008959';
    const GREEN_LIGHT = 'rgba(0,137,89,0.12)';
    const ORANGE      = '#E65100';
    const ORANGE_BG   = [
        'rgba(251,191,36,0.88)',
        'rgba(230,81,0,0.85)',
        'rgba(191,54,12,0.85)',
        'rgba(130,30,5,0.85)'
    ];

    /* Barras horizontais — por Região */
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
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x} ocorrências` } }
                },
                scales: {
                    x: { beginAtZero:true, grid:{ color:'rgba(0,0,0,0.04)' }, ticks:{ font:{ size:10 } } },
                    y: { grid:{ display:false }, ticks:{ font:{ size:10 } } }
                }
            }
        });
    }

    /* Barras verticais — por Período */
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
                    borderWidth: 0,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} ocorrências` } }
                },
                scales: {
                    y: { beginAtZero:true, grid:{ color:'rgba(0,0,0,0.04)' }, ticks:{ font:{ size:10 } } },
                    x: { grid:{ display:false }, ticks:{ font:{ size:10 } } }
                }
            }
        });
    }
}

/* Inicia */
initDashboard();