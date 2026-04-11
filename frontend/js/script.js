// ==========================================
// ESTADO GLOBAL E CONFIGURAÇÕES
// ==========================================
const AppState = {
    filtros: {
        corporacao: 'todas',
        regional: 'todas'
    },
    dadosCompletos: [] 
};

const ConfigCorporacoes = {
    'PM': { nome: 'Polícia Militar', corClass: 'bg-pm', corHex: '#1976d2' },
    'CBM': { nome: 'Corpo de Bombeiros', corClass: 'bg-cbm', corHex: '#d32f2f' },
    'GM': { nome: 'Guarda Municipal', corClass: 'bg-gm', corHex: '#fbc02d' }
};

// ==========================================
// MAPEAMENTO DO DOM
// ==========================================
const elementosDOM = {
    selectCorporacao: document.getElementById('corporation'),
    selectRegional: document.getElementById('regional'),
    textoTotalBatalhoes: document.getElementById('total_batalhoes'),
    textoTotalEfetivo: document.getElementById('total_efetivo'),
    containerMarcadores: document.getElementById('map_markers'),
    containerGrafico: document.getElementById('bar_chart'),
    containerLegenda: document.getElementById('chart_legend'),
    graficoRosca: document.getElementById('doughnut_efetivo'),
    legendaRosca: document.getElementById('legend_doughnut'),
    containerRegionais: document.getElementById('bar_chart_regionais'),
    containerRanking: document.getElementById('ranking_efetivo')
};

// ==========================================
// COMUNICAÇÃO COM A API (BACKEND)
// ==========================================
async function buscarDadosDoBanco() {
    try {
        const url = `http://localhost:3000/api/unidades?corporacao=${AppState.filtros.corporacao}&regional=${AppState.filtros.regional}`;
        const resposta = await fetch(url);
        
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }
        
        const dados = await resposta.json();
        AppState.dadosCompletos = dados;
        
        atualizarInterface(dados);
        
    } catch (erro) {
        console.error("Erro ao buscar dados do banco:", erro);
        elementosDOM.containerMarcadores.innerHTML = '<p style="color: #d32f2f; font-weight: bold; padding: 20px;">Erro de conexão com o servidor. Verifique se o Node.js está rodando.</p>';
    }
}

// ==========================================
// FUNÇÕES DE RENDERIZAÇÃO
// ==========================================

function renderizarMapa(dados) {
    elementosDOM.containerMarcadores.innerHTML = ''; 
    
    dados.forEach(unidade => {
        const marcador = document.createElement('div');
        marcador.className = 'marker';
        marcador.setAttribute('role', 'button');
        marcador.setAttribute('tabindex', '0');
        
        marcador.style.top = unidade.lat + '%';
        marcador.style.left = unidade.lng + '%';
        marcador.style.backgroundColor = ConfigCorporacoes[unidade.corporacao].corHex;
        
        const infoTexto = `${unidade.nome} (${unidade.corporacao}) - ${unidade.regional}`;
        marcador.title = infoTexto;
        marcador.setAttribute('aria-label', infoTexto);
        
        marcador.addEventListener('click', () => {
            alert(`DETALHES DA UNIDADE\n\nNome: ${unidade.nome}\nCorporação: ${ConfigCorporacoes[unidade.corporacao].nome}\nRegional: ${unidade.regional}\nEfetivo Estimado: ${unidade.efetivo} agentes`);
        });

        // Acessibilidade: Clicar com o teclado (Enter ou Espaço)
        marcador.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                marcador.click();
            }
        });

        elementosDOM.containerMarcadores.appendChild(marcador);
    });
}

function renderizarGraficosCorporacao(dados) {
    elementosDOM.containerGrafico.innerHTML = '';
    elementosDOM.containerLegenda.innerHTML = '';
    elementosDOM.legendaRosca.innerHTML = '';

    const totalUnidades = dados.length;
    if (totalUnidades === 0) {
        elementosDOM.containerGrafico.innerHTML = '<p style="color: #999;">Sem dados para exibir.</p>';
        elementosDOM.graficoRosca.style.background = 'conic-gradient(#eee 0% 100%)';
        return;
    }

    const contagem = { 'PM': { unid: 0, efetivo: 0 }, 'CBM': { unid: 0, efetivo: 0 }, 'GM': { unid: 0, efetivo: 0 } };
    let totalEfetivo = 0;

    dados.forEach(u => {
        contagem[u.corporacao].unid++;
        contagem[u.corporacao].efetivo += (u.efetivo || 0);
        totalEfetivo += (u.efetivo || 0);
    });

    let conicGradientString = [];
    let acumuloGraus = 0;

    Object.keys(contagem).forEach(corp => {
        const stats = contagem[corp];
        const config = ConfigCorporacoes[corp];

        // 1. Gráfico de Barras (Unidades)
        if (stats.unid > 0 || AppState.filtros.corporacao === 'todas') {
            const porcentagemUnid = totalUnidades > 0 ? Math.round((stats.unid / totalUnidades) * 100) : 0;
            
            elementosDOM.containerGrafico.innerHTML += `
                <div class="bar_row">
                    <span class="bar_label">${corp}</span>
                    <div class="bar_track">
                        <div class="bar_fill ${config.corClass}" style="width: ${porcentagemUnid}%">
                            ${stats.unid > 0 ? porcentagemUnid + '%' : ''}
                        </div>
                    </div>
                </div>
            `;

            elementosDOM.containerLegenda.innerHTML += `
                <li class="legend_item"><span class="legend_color ${config.corClass}"></span>${config.nome}: ${stats.unid} unid.</li>
            `;
        }

        // 2. Gráfico de Rosca (Efetivo)
        if (stats.efetivo > 0) {
            const porcentagemEfetivo = (stats.efetivo / totalEfetivo) * 100;
            const fimGraus = acumuloGraus + porcentagemEfetivo;
            conicGradientString.push(`${config.corHex} ${acumuloGraus}% ${fimGraus}%`);
            acumuloGraus = fimGraus;

            elementosDOM.legendaRosca.innerHTML += `
                <li class="legend_item"><span class="legend_color ${config.corClass}"></span>${corp}: ${stats.efetivo} ag.</li>
            `;
        }
    });

    // Desenha o gráfico de rosca manipulando o CSS
    elementosDOM.graficoRosca.style.background = `conic-gradient(${conicGradientString.join(', ')})`;
}

function renderizarGraficoRegionais(dados) {
    elementosDOM.containerRegionais.innerHTML = '';
    
    if (dados.length === 0) {
        elementosDOM.containerRegionais.innerHTML = '<p style="color: #999;">Sem dados para exibir.</p>';
        return;
    }

    const contagemRegionais = {};
    dados.forEach(u => {
        contagemRegionais[u.regional] = (contagemRegionais[u.regional] || 0) + 1;
    });

    // Ordena as regionais da que tem mais unidades para a que tem menos
    const regionaisOrdenadas = Object.entries(contagemRegionais).sort((a, b) => b[1] - a[1]);
    const maxUnidades = regionaisOrdenadas[0][1];

    regionaisOrdenadas.forEach(([regional, qtd]) => {
        const porcentagem = (qtd / maxUnidades) * 100;
        
        elementosDOM.containerRegionais.innerHTML += `
            <div class="bar_row">
                <span class="bar_label" style="width: 70px;">${regional}</span>
                <div class="bar_track">
                    <div class="bar_fill" style="width: ${porcentagem}%; background-color: #008959;">
                        ${qtd}
                    </div>
                </div>
            </div>
        `;
    });
}

function renderizarRankingEfetivo(dados) {
    elementosDOM.containerRanking.innerHTML = '';
    
    if (dados.length === 0) {
        elementosDOM.containerRanking.innerHTML = '<p style="color: #999;">Sem dados para exibir.</p>';
        return;
    }

    // Ordena do maior efetivo para o menor e pega os top 5
    const top5 = [...dados].sort((a, b) => (b.efetivo || 0) - (a.efetivo || 0)).slice(0, 5);

    top5.forEach((unidade, index) => {
        elementosDOM.containerRanking.innerHTML += `
            <li class="ranking_item" style="border-left-color: ${ConfigCorporacoes[unidade.corporacao].corHex}">
                <div>
                    <strong>${index + 1}º ${unidade.nome}</strong>
                    <br><span style="font-size: 11px;">${unidade.regional} - ${ConfigCorporacoes[unidade.corporacao].nome}</span>
                </div>
                <div class="ranking_efetivo_badge">${unidade.efetivo} ag.</div>
            </li>
        `;
    });
}

// ==========================================
// ATUALIZAÇÃO GERAL E INICIALIZAÇÃO
// ==========================================

function atualizarInterface(dados) {
    // 1. Atualiza Indicadores Numéricos
    elementosDOM.textoTotalBatalhoes.textContent = dados.length;

    const somaEfetivo = dados.reduce((acc, curr) => acc + (curr.efetivo || 0), 0);
    elementosDOM.textoTotalEfetivo.textContent = somaEfetivo.toLocaleString('pt-BR');

    // 2. Renderiza Mapa e Gráficos
    renderizarMapa(dados);
    renderizarGraficosCorporacao(dados);
    renderizarGraficoRegionais(dados);
    renderizarRankingEfetivo(dados);
}

function iniciarAplicacao() {
    // Adiciona os ouvintes de eventos aos filtros
    elementosDOM.selectCorporacao.addEventListener('change', (evento) => {
        AppState.filtros.corporacao = evento.target.value;
        buscarDadosDoBanco();
    });

    elementosDOM.selectRegional.addEventListener('change', (evento) => {
        AppState.filtros.regional = evento.target.value;
        buscarDadosDoBanco();
    });

    // Faz a primeira busca ao carregar a página
    buscarDadosDoBanco();
}

// Garante que o código só rode após o HTML estar 100% carregado
document.addEventListener('DOMContentLoaded', iniciarAplicacao);