const AppState = {
    filtros: {
        corporacao: 'todas',
        regional: 'todas'
    },
    // Array para armazenar os dados vindos do banco
    dadosCompletos: [] 
};

const ConfigCorporacoes = {
    'PM': { nome: 'Polícia Militar', corClass: 'bg-pm', corHex: '#1976d2' },
    'CBM': { nome: 'Corpo de Bombeiros', corClass: 'bg-cbm', corHex: '#d32f2f' },
    'GM': { nome: 'Guarda Municipal', corClass: 'bg-gm', corHex: '#fbc02d' }
};

const elementosDOM = {
    selectCorporacao: document.getElementById('corporation'),
    selectRegional: document.getElementById('regional'),
    textoTotalBatalhoes: document.getElementById('total_batalhoes'),
    textoTotalEfetivo: document.getElementById('total_efetivo'),
    containerMarcadores: document.getElementById('map_markers'),
    // Elementos dos Gráficos
    containerGrafico: document.getElementById('bar_chart'),
    containerLegenda: document.getElementById('chart_legend'),
    graficoRosca: document.getElementById('doughnut_efetivo'),
    legendaRosca: document.getElementById('legend_doughnut'),
    containerRegionais: document.getElementById('bar_chart_regionais'),
    containerRanking: document.getElementById('ranking_efetivo')
};

// Função para buscar dados da API do Backend
async function buscarDadosDoBanco() {
    try {
        const url = `http://localhost:3000/api/unidades?corporacao=${AppState.filtros.corporacao}&regional=${AppState.filtros.regional}`;
        const resposta = await fetch(url);
        
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }
        
        const dados = await resposta.json();
        AppState.dadosCompletos = dados;
        
        // Após buscar os dados, atualiza a tela
        atualizarInterface(dados);
        
    } catch (erro) {
        console.error("Erro ao buscar dados do PostgreSQL:", erro);
        elementosDOM.containerMarcadores.innerHTML = '<p style="color: red; padding: 20px;">Erro de conexão com o banco de dados.</p>';
    }
}

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
        
        const infoTexto = `${unidade.nome} (${unidade.corporacao}) pertencente a ${unidade.regional}`;
        marcador.title = infoTexto;
        marcador.setAttribute('aria-label', infoTexto);
        
        marcador.addEventListener('click', () => {
            alert(`Informações da Unidade:\n\nNome: ${unidade.nome}\nCorporação: ${unidade.corporacao}\nRegional: ${unidade.regional}\nEfetivo Estimado: ${unidade.efetivo} agentes`);
        });

        marcador.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                marcador.click();
            }
        });

        elementosDOM.containerMarcadores.appendChild(marcador);
    });
}

// Renderiza gráficos gerais (Unidades e Efetivo por Corporação)
function renderizarGraficosCorporacao(dados) {
    elementosDOM.containerGrafico.innerHTML = '';
    elementosDOM.containerLegenda.innerHTML = '';
    elementosDOM.legendaRosca.innerHTML = '';

    const totalUnidades = dados.length;
    if (totalUnidades === 0) {
        elementosDOM.containerGrafico.innerHTML = '<p style="color: #999;">Sem dados.</p>';
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
                <li class="legend_item"><span class="legend_color ${config.corClass}"></span>${config.nome}: ${stats.unid}</li>
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

    // Aplica as cores no gráfico de rosca
    elementosDOM.graficoRosca.style.background = `conic-gradient(${conicGradientString.join(', ')})`;
}

// Renderiza o Gráfico de Barras por Regionais
function renderizarGraficoRegionais(dados) {
    elementosDOM.containerRegionais.innerHTML = '';
    
    if (dados.length === 0) return;

    const contagemRegionais = {};
    dados.forEach(u => {
        contagemRegionais[u.regional] = (contagemRegionais[u.regional] || 0) + 1;
    });

    // Ordena do maior para o menor
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

// Renderiza o Top 5 de Efetivo
function renderizarRankingEfetivo(dados) {
    elementosDOM.containerRanking.innerHTML = '';
    
    if (dados.length === 0) return;

    // Ordena as unidades por efetivo em ordem decrescente e pega as 5 primeiras
    const top5 = [...dados].sort((a, b) => (b.efetivo || 0) - (a.efetivo || 0)).slice(0, 5);

    top5.forEach((unidade, index) => {
        elementosDOM.containerRanking.innerHTML += `
            <li class="ranking_item" style="border-left-color: ${ConfigCorporacoes[unidade.corporacao].corHex}">
                <div>
                    <strong>${index + 1}º ${unidade.nome}</strong>
                    <br><span style="font-size: 11px;">${unidade.regional}</span>
                </div>
                <div class="ranking_efetivo_badge">${unidade.efetivo} ag.</div>
            </li>
        `;
    });
}

function atualizarInterface(dados) {
    elementosDOM.textoTotalBatalhoes.textContent = dados.length;

    const somaEfetivo = dados.reduce((acc, curr) => acc + (curr.efetivo || 0), 0);
    elementosDOM.textoTotalEfetivo.textContent = somaEfetivo.toLocaleString('pt-BR');

    renderizarMapa(dados);
    
    // Chamada dos 4 painéis gráficos
    renderizarGraficosCorporacao(dados);
    renderizarGraficoRegionais(dados);
    renderizarRankingEfetivo(dados);
}

function iniciarAplicacao() {
    elementosDOM.selectCorporacao.addEventListener('change', (evento) => {
        AppState.filtros.corporacao = evento.target.value;
        buscarDadosDoBanco(); // Faz nova requisição ao banco
    });

    elementosDOM.selectRegional.addEventListener('change', (evento) => {
        AppState.filtros.regional = evento.target.value;
        buscarDadosDoBanco(); // Faz nova requisição ao banco
    });

    // Busca inicial ao carregar a página
    buscarDadosDoBanco();
}

document.addEventListener('DOMContentLoaded', iniciarAplicacao);