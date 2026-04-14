/* ============================================================
   LÓGICA DO DASHBOARD COM MAPA LEAFLET.JS E FILTROS
   ============================================================ */

let graficoUnidades = null;
let graficoEfetivo = null;

const map = L.map('map_wrapper').setView([-3.7327, -38.5270], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

const coresRegionais = ["#f8bbd0", "#e1f5fe", "#fff9c4", "#e1bee7", "#ffccbc", "#c8e6c9", "#ffe0b2"];
const camadaBatalhoes = L.layerGroup().addTo(map);

// ==========================================
// DADOS MOCKADOS (PLANO B OFFLINE)
// ==========================================
const DADOS_MOCKADOS_OFFLINE = [
    { nome: '1º CRPM / 5º BPM', corporacao: 'PM', regional: 'Centro', latitude: -3.728330, longitude: -38.528330, efetivo: 250 },
    { nome: '8º BPM (Aldeota)', corporacao: 'PM', regional: 'SER II', latitude: -3.738050, longitude: -38.502220, efetivo: 200 },
    { nome: 'CPChoque / COTAM', corporacao: 'PM', regional: 'SER II', latitude: -3.746110, longitude: -38.461660, efetivo: 400 },
    { nome: 'CPRAIO', corporacao: 'PM', regional: 'SER III', latitude: -3.734720, longitude: -38.553330, efetivo: 300 },
    { nome: '1ª Cia / 1º BBM (Jacarecanga)', corporacao: 'CBM', regional: 'SER I', latitude: -3.725000, longitude: -38.541000, efetivo: 40 },
    { nome: 'Comando Geral BBM (Parreão)', corporacao: 'CBM', regional: 'SER IV', latitude: -3.753000, longitude: -38.533000, efetivo: 80 },
    { nome: '3ª Cia / 1º BBM (Messejana)', corporacao: 'CBM', regional: 'SER VI', latitude: -3.832000, longitude: -38.498000, efetivo: 40 },
    { nome: 'Torre GM Lagoinha', corporacao: 'GM', regional: 'Centro', latitude: -3.726000, longitude: -38.530000, efetivo: 15 },
    { nome: 'Torre GM Beira Mar', corporacao: 'GM', regional: 'SER II', latitude: -3.728000, longitude: -38.498000, efetivo: 15 },
    { nome: 'Torre GM Jangurussu', corporacao: 'GM', regional: 'SER VI', latitude: -3.831000, longitude: -38.508000, efetivo: 15 }
];

async function initDashboard() {
    try {
        const responseGeo = await fetch('/frontend/data/regionais.json');
        const geoData = await responseGeo.json();

        let indexCor = 0;
        L.geoJSON(geoData, {
            style: function (feature) {
                const color = coresRegionais[indexCor % coresRegionais.length];
                indexCor++;
                return { color: "#008959", weight: 2, fillColor: color, fillOpacity: 0.4 };
            },
            onEachFeature: function (feature, layer) {
                layer.bindPopup(`<b>${feature.properties.nome || "Regional"}</b>`);
            }
        }).addTo(map);

        const statusDiv = document.getElementById("map_status");
        if (statusDiv) statusDiv.remove();

        popularFiltroRegionais(geoData);

        setTimeout(() => { map.invalidateSize(); }, 500);

        // Inicia a primeira carga de dados
        await loadBatalhoes('todas', 'todas');

    } catch (error) {
        console.error("Erro ao carregar o arquivo regionais.json:", error);
    }
}

// 2. BUSCA DE DADOS (COM BLINDAGEM OFFLINE)
async function loadBatalhoes(corporacao, regional) {
    camadaBatalhoes.clearLayers();
    let unidades = [];

    try {
        const url = `http://localhost:3000/api/unidades?corporacao=${corporacao}&regional=${regional}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error("Erro na API");
        unidades = await response.json();
    } catch (err) {
        console.warn("API Offline. Usando dados mockados para apresentação...");
        
        // Aplica os filtros diretamente na lista de segurança
        unidades = DADOS_MOCKADOS_OFFLINE.filter(u => {
            const passaCorp = (corporacao === 'todas' || u.corporacao === corporacao);
            const passaReg = (regional === 'todas' || u.regional === regional);
            return passaCorp && passaReg;
        });
    }

    // Atualiza KPIs (Nomes baseados no seu HTML original)
    const kpiBatalhoes = document.getElementById("total_batalhoes");
    const kpiEfetivo = document.getElementById("total_efetivo");
    
    if (kpiBatalhoes) kpiBatalhoes.innerText = unidades.length;
    
    const totalEfetivo = unidades.reduce((sum, b) => sum + Number(b.efetivo), 0);
    if (kpiEfetivo) kpiEfetivo.innerText = totalEfetivo;

    // Desenha os pontos
    unidades.forEach(uni => {
        let cor = '#fbc02d'; // GM (Amarelo)
        if (uni.corporacao === 'PM') cor = '#1976d2'; // Azul
        if (uni.corporacao === 'CBM') cor = '#d32f2f'; // Vermelho

        const marker = L.circleMarker([uni.latitude, uni.longitude], {
            radius: 8, fillColor: cor, color: '#ffffff', weight: 2, fillOpacity: 1
        });

        marker.bindPopup(`
            <div style="text-align: center;">
                <strong style="color: ${cor}; font-size: 14px;">${uni.nome}</strong><br>
                <b>Corporação:</b> ${uni.corporacao}<br>
                <b>Efetivo:</b> ${uni.efetivo} agentes
            </div>
        `);

        marker.addTo(camadaBatalhoes);
    });

    // Dispara a atualização dos gráficos
    atualizarGraficos(unidades);
}

// 3. OUVINTES DE EVENTO (Filtros)
document.getElementById('corporation').addEventListener('change', aplicarFiltros);
document.getElementById('regional').addEventListener('change', aplicarFiltros);

function aplicarFiltros() {
    const corp = document.getElementById('corporation').value;
    const reg = document.getElementById('regional').value;
    loadBatalhoes(corp, reg);
}

function popularFiltroRegionais(geoData) {
    const select = document.getElementById('regional');
    const nomes = geoData.features.map(f => f.properties.nome).filter(n => n);

    nomes.forEach(nome => {
        const option = document.createElement('option');
        option.value = nome;
        option.innerText = nome;
        select.appendChild(option);
    });
}

// ==========================================
// RENDERIZAÇÃO DOS GRÁFICOS (CHART.JS)
// ==========================================
function atualizarGraficos(unidades) {
    const contagem = { PM: 0, CBM: 0, GM: 0 };
    const efetivo = { PM: 0, CBM: 0, GM: 0 };
    
    unidades.forEach(u => {
        if(contagem[u.corporacao] !== undefined) {
            contagem[u.corporacao] += 1;
            efetivo[u.corporacao] += Number(u.efetivo);
        }
    });

    const labels = ['Polícia Militar', 'Bombeiros', 'Guarda Municipal'];
    const cores = ['#1976d2', '#d32f2f', '#fbc02d'];

    // Gráfico de Barras
    const ctxBar = document.getElementById('bar_chart_unidades');
    if (ctxBar) {
        if (graficoUnidades) graficoUnidades.destroy();
        
        graficoUnidades = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Bases/Quartéis Ativos',
                    data: [contagem.PM, contagem.CBM, contagem.GM],
                    backgroundColor: cores,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    // Gráfico de Rosca
    const ctxDoughnut = document.getElementById('doughnut_efetivo');
    if (ctxDoughnut) {
        if (graficoEfetivo) graficoEfetivo.destroy();
        
        graficoEfetivo = new Chart(ctxDoughnut, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: [efetivo.PM, efetivo.CBM, efetivo.GM],
                    backgroundColor: cores,
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
}

// Inicia o sistema
initDashboard();