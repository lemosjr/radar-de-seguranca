document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. PROTEÇÃO DE ROTA (ROUTE GUARD)
    // ==========================================
    const sessaoUsuario = localStorage.getItem('usuario');
    
    if (!sessaoUsuario) {
        window.location.href = 'login.html';
        return; 
    }

    const utilizador = JSON.parse(sessaoUsuario);

    // ==========================================
    // 2. MAPEAMENTO DE ELEMENTOS (UI)
    // ==========================================
    const DOM = {
        cartaoHeader: document.getElementById('user_card_header'),
        avatarIniciais: document.getElementById('avatar_initials'),
        tituloNome: document.getElementById('card_title'),
        subtituloCargo: document.getElementById('user_role_display'),
        
        info: {
            nome: document.getElementById('info_nome'),
            cpf: document.getElementById('info_cpf'),
            telefone: document.getElementById('info_telefone'),
            email: document.getElementById('info_email'),
            corporacao: document.getElementById('info_corporacao'),
            patente: document.getElementById('info_patente'),
            permissao: document.getElementById('info_permissao')
        },
        
        botoes: {
            sair: document.getElementById('btn_encerrar_sessao'),
            editar: document.getElementById('btn_editar_perfil')
        }
    };

    // ==========================================
    // 3. UTILITÁRIOS E FORMATAÇÃO (CLEAN CODE)
    // ==========================================
    const Utils = {
        obterIniciais: (nomeCompleto) => {
            if (!nomeCompleto) return '--';
            const partes = nomeCompleto.trim().split(' ');
            if (partes.length > 1) {
                return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
            }
            return nomeCompleto.substring(0, 2).toUpperCase();
        },

        formatarCPF: (cpf) => {
            if (!cpf) return 'Não informado';
            const cpfLimpo = cpf.replace(/\D/g, '');
            if (cpfLimpo.length !== 11) return '***.***.***-**';
            return `***.***.***-${cpfLimpo.slice(-2)}`;
        },

        formatarTelefone: (telefone) => {
            if (!telefone) return 'Não informado';
            const telLimpo = telefone.replace(/\D/g, '');
            if (telLimpo.length === 11) {
                return `(**) *****-**${telLimpo.slice(-2)}`;
            } else if (telLimpo.length === 10) {
                return `(**) ****-**${telLimpo.slice(-2)}`;
            }
            return '*'.repeat(Math.max(0, telLimpo.length - 2)) + telLimpo.slice(-2);
        }
    };

    // ==========================================
    // 4. INJEÇÃO DE DADOS NA INTERFACE
    // ==========================================
    const inicializarPerfil = () => {
        // Cabeçalho Visual
        if (DOM.tituloNome) DOM.tituloNome.textContent = utilizador.nome || 'Agente Desconhecido';
        if (DOM.subtituloCargo) DOM.subtituloCargo.textContent = `${utilizador.tipo_militar || 'Agente'} - ${utilizador.corporacao || 'SSPDS'}`;
        if (DOM.avatarIniciais) DOM.avatarIniciais.textContent = Utils.obterIniciais(utilizador.nome);

        // Tabela de Dados Funcionais
        if (DOM.info.nome) DOM.info.nome.textContent = utilizador.nome || 'Não informado';
        if (DOM.info.cpf) DOM.info.cpf.textContent = Utils.formatarCPF(utilizador.cpf);
        if (DOM.info.telefone) DOM.info.telefone.textContent = Utils.formatarTelefone(utilizador.telefone);
        if (DOM.info.email) DOM.info.email.textContent = utilizador.email || 'Não informado';
        if (DOM.info.corporacao) DOM.info.corporacao.textContent = utilizador.corporacao || 'Não informada';
        if (DOM.info.patente) DOM.info.patente.textContent = utilizador.tipo_militar || 'Não informada';
        if (DOM.info.permissao) DOM.info.permissao.textContent = utilizador.nivel_acesso || 'Operacional';
    };

    // ==========================================
    // 5. EVENTOS DE AÇÃO
    // ==========================================
    DOM.botoes.sair?.addEventListener('click', () => {
        if (confirm('Tem a certeza de que deseja encerrar a sua sessão segura?')) {
            localStorage.removeItem('usuario');
            window.location.href = 'login.html';
        }
    });

    DOM.botoes.editar?.addEventListener('click', () => {
        alert('A edição de dados institucionais deve ser solicitada via protocolo interno dos Recursos Humanos da sua respetiva corporação.');
    });

    // Arranca a configuração da página
    inicializarPerfil();
});