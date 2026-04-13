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

// 1. CRIAMOS UMA CAMADA ESPECÍFICA PARA OS PONTOS
// Isso permite apagar os pontos velhos antes de desenhar os filtrados
const camadaBatalhoes = L.layerGroup().addTo(map);

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

        // Popular o select de Regionais dinamicamente (se quiser) ou usar o HTML
        popularFiltroRegionais(geoData);

        // Força o Leaflet a recalcular o tamanho após carregar (Corrige o bug visual)
        setTimeout(() => { map.invalidateSize(); }, 500);

        // Carrega as unidades a primeira vez (Sem filtros)
        await loadBatalhoes('todas', 'todas');

    } catch (error) {
        console.error("Erro ao carregar o arquivo regionais.json:", error);
    }
}

// 2. A FUNÇÃO ATUALIZADA (Agora aceita os filtros)
async function loadBatalhoes(corporacao, regional) {
    // Limpa os pontos do mapa toda vez que a função é chamada!
    camadaBatalhoes.clearLayers();

    let unidades = [];
    try {
        // Monta a URL dinamicamente batendo na sua API do Node.js
        const url = `http://localhost:3000/api/unidades?corporacao=${corporacao}&regional=${regional}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error("Erro na API");
        unidades = await response.json();
    } catch (err) {
        console.warn("Usando mock para filtros locais...");
        // Mock rápido caso o DB esteja off
        unidades = [
            { nome: "1º BPM", corporacao: "PM", regional: "SER I", latitude: -3.734, longitude: -38.495, efetivo: 120 },
            { nome: "Quartel CBM", corporacao: "CBM", regional: "Centro", latitude: -3.720, longitude: -38.530, efetivo: 80 }
        ].filter(u => (corporacao === 'todas' || u.corporacao === corporacao));
    }

    // Atualiza KPIs
    document.getElementById("total_batalhoes").innerText = unidades.length;
    const totalEfetivo = unidades.reduce((sum, b) => sum + Number(b.efetivo), 0);
    document.getElementById("total_efetivo").innerText = totalEfetivo;

    // Desenha os novos pontos na camada de batalhões
    unidades.forEach(uni => {
        let cor = '#fbc02d';
        if (uni.corporacao === 'PM') cor = '#1976d2';
        if (uni.corporacao === 'CBM') cor = '#d32f2f';

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

        // Adiciona o ponto na camada correta
        marker.addTo(camadaBatalhoes);

        atualizarGraficos(unidades);
    });
}

// 3. OUVINTES DE EVENTO (Eles disparam quando você mexe no select)
document.getElementById('corporation').addEventListener('change', aplicarFiltros);
document.getElementById('regional').addEventListener('change', aplicarFiltros);

function aplicarFiltros() {
    const corp = document.getElementById('corporation').value;
    const reg = document.getElementById('regional').value;

    // Chama a função passando o que o usuário escolheu
    loadBatalhoes(corp, reg);
}

// Função extra para preencher o select de regionais usando seu JSON
function popularFiltroRegionais(geoData) {
    const select = document.getElementById('regional');
    // Coleta o nome das regionais do arquivo
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
    // 1. Somando os dados mockados de efetivo e bases
    const contagem = { PM: 0, CBM: 0, GM: 0 };
    const efetivo = { PM: 0, CBM: 0, GM: 0 };
    
    unidades.forEach(u => {
        if(contagem[u.corporacao] !== undefined) {
            contagem[u.corporacao] += 1;
            efetivo[u.corporacao] += Number(u.efetivo); // Soma o efetivo que veio do banco!
        }
    });

    const labels = ['Polícia Militar', 'Bombeiros', 'Guarda Municipal'];
    const cores = ['#1976d2', '#d32f2f', '#fbc02d'];

    // 2. Gráfico de Barras: Quantidade de Unidades Físicas
    const ctxBar = document.getElementById('bar_chart_unidades');
    if (graficoUnidades) graficoUnidades.destroy(); // Apaga o velho ao filtrar
    
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
            plugins: { legend: { display: false } } // Esconde a legenda para ficar limpo
        }
    });

    // 3. Gráfico de Rosca: Força de Efetivo
    const ctxDoughnut = document.getElementById('doughnut_efetivo');
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
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Inicia
initDashboard();