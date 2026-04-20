document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. VERIFICAÇÃO DE SEGURANÇA (ROUTE GUARD)
    // ==========================================
    const usuarioString = localStorage.getItem('usuario');
    
    if (!usuarioString) {
        window.location.href = 'login.html';
        return; 
    }

    const usuario = JSON.parse(usuarioString);

    // ==========================================
    // 2. MAPEAMENTO DE ELEMENTOS DO DOM
    // ==========================================
    const elementos = {
        cabecalhoCartao: document.getElementById('user_card_header'),
        avatarIniciais: document.getElementById('avatar_initials'),
        tituloNome: document.getElementById('card_title'),
        subtituloCargo: document.getElementById('user_role_display'),
        
        infoNome: document.getElementById('info_nome'),
        infoCpf: document.getElementById('info_cpf'),
        infoTelefone: document.getElementById('info_telefone'),
        infoEmail: document.getElementById('info_email'),
        infoCorporacao: document.getElementById('info_corporacao'),
        infoPatente: document.getElementById('info_patente'),
        infoPermissao: document.getElementById('info_permissao'),
        
        btnSair: document.getElementById('btn_encerrar_sessao'),
        btnEditar: document.getElementById('btn_editar_perfil')
    };

    // ==========================================
    // 3. FUNÇÕES UTILITÁRIAS (CLEAN CODE)
    // ==========================================

    const obterIniciais = (nomeCompleto) => {
        const partes = nomeCompleto.trim().split(' ');
        if (partes.length > 1) {
            return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
        }
        return nomeCompleto.substring(0, 2).toUpperCase();
    };

    const mascararCPF = (cpf) => {
        if (!cpf || cpf.length !== 14) return '***.***.***-**';
        // Exibe apenas os últimos dois dígitos. Ex: ***.***.***-89
        const ultimosDigitos = cpf.slice(-2);
        return `***.***.***-${ultimosDigitos}`;
    };

    const formatarTelefone = (telefone) => {
        if (!telefone) return 'Não informado';
        // Caso a API retorne apenas números, aplica a formatação visual (XX) XXXXX-XXXX
        const telLimpo = telefone.replace(/\D/g, '');
        if (telLimpo.length >= 10) {
            return telLimpo.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
        }
        return telefone; 
    };

    const aplicarTemaCorporacao = (corporacao, elementoCartao) => {
        elementoCartao.classList.remove('theme-pm', 'theme-cbm', 'theme-gm');
        const corpUpper = corporacao.toUpperCase();
        
        if (['PM', 'CBM', 'GM'].includes(corpUpper)) {
            elementoCartao.classList.add(`theme-${corpUpper.toLowerCase()}`);
        }
    };

    // ==========================================
    // 4. INJEÇÃO DE DADOS NA INTERFACE
    // ==========================================

    // Dados Visuais e Cabeçalho
    elementos.tituloNome.textContent = usuario.nome;
    elementos.subtituloCargo.textContent = `${usuario.tipo_militar} - ${usuario.corporacao}`;
    elementos.avatarIniciais.textContent = obterIniciais(usuario.nome);
    aplicarTemaCorporacao(usuario.corporacao, elementos.cabecalhoCartao);

    // Dados Funcionais (Corpo do Cartão)
    if (elementos.infoNome) elementos.infoNome.textContent = usuario.nome;
    if (elementos.infoCpf) elementos.infoCpf.textContent = mascararCPF(usuario.cpf);
    if (elementos.infoTelefone) elementos.infoTelefone.textContent = formatarTelefone(usuario.telefone);
    if (elementos.infoEmail) elementos.infoEmail.textContent = usuario.email;
    if (elementos.infoCorporacao) elementos.infoCorporacao.textContent = usuario.corporacao;
    if (elementos.infoPatente) elementos.infoPatente.textContent = usuario.tipo_militar;
    if (elementos.infoPermissao) elementos.infoPermissao.textContent = usuario.nivel_acesso || 'Operacional';

    // ==========================================
    // 5. EVENTOS DOS BOTÕES DE AÇÃO
    // ==========================================

    elementos.btnSair.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja encerrar sua sessão segura?')) {
            localStorage.removeItem('usuario');
            window.location.href = 'login.html';
        }
    });

    elementos.btnEditar.addEventListener('click', () => {
        alert('A edição de dados institucionais deve ser solicitada via protocolo interno do RH da sua respectiva corporação.');
    });
});