const AppState = {
    filtros: {
        corporacao: 'todas',
        regional: 'todas'
    }
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
    containerMarcadores: document.getElementById('map_markers'),
    containerGrafico: document.getElementById('bar_chart'),
    containerLegenda: document.getElementById('chart_legend')
};

function obterDadosFiltrados() {
    return batalhoesMockados.filter(batalhao => {
        const atendeCorporacao = AppState.filtros.corporacao === 'todas' || batalhao.corporacao === AppState.filtros.corporacao;
        const atendeRegional = AppState.filtros.regional === 'todas' || batalhao.regional === AppState.filtros.regional;
        return atendeCorporacao && atendeRegional;
    });
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
            alert(`Informações da Unidade:\nNome: ${unidade.nome}\nCorporação: ${unidade.corporacao}\nRegional: ${unidade.regional}`);
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

function renderizarGrafico(dados) {
    elementosDOM.containerGrafico.innerHTML = '';
    elementosDOM.containerLegenda.innerHTML = '';

    const total = dados.length;
    if (total === 0) {
        elementosDOM.containerGrafico.innerHTML = '<p style="color: #999;">Nenhum dado para exibir no gráfico.</p>';
        return;
    }

    const contagem = { 'PM': 0, 'CBM': 0, 'GM': 0 };
    dados.forEach(unidade => contagem[unidade.corporacao]++);

    Object.keys(contagem).forEach(corp => {
        const quantidade = contagem[corp];
        if (quantidade > 0 || AppState.filtros.corporacao === 'todas') {
            const porcentagem = total > 0 ? Math.round((quantidade / total) * 100) : 0;
            const config = ConfigCorporacoes[corp];

            const barRow = document.createElement('div');
            barRow.className = 'bar_row';
            barRow.innerHTML = `
                <span class="bar_label">${corp}</span>
                <div class="bar_track">
                    <div class="bar_fill ${config.corClass}" style="width: ${porcentagem}%">
                        ${quantidade > 0 ? porcentagem + '%' : ''}
                    </div>
                </div>
            `;
            elementosDOM.containerGrafico.appendChild(barRow);

            const legendItem = document.createElement('li');
            legendItem.className = 'legend_item';
            legendItem.innerHTML = `
                <span class="legend_color ${config.corClass}"></span>
                ${config.nome}: ${quantidade} unidade(s)
            `;
            elementosDOM.containerLegenda.appendChild(legendItem);
        }
    });
}

function atualizarInterface() {
    const dados = obterDadosFiltrados();
    
    elementosDOM.textoTotalBatalhoes.textContent = dados.length;
    renderizarMapa(dados);
    renderizarGrafico(dados);
}

function iniciarAplicacao() {
    elementosDOM.selectCorporacao.addEventListener('change', (evento) => {
        AppState.filtros.corporacao = evento.target.value;
        atualizarInterface();
    });

    elementosDOM.selectRegional.addEventListener('change', (evento) => {
        AppState.filtros.regional = evento.target.value;
        atualizarInterface();
    });

    atualizarInterface();
}

document.addEventListener('DOMContentLoaded', iniciarAplicacao);