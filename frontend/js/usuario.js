document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. VERIFICAÇÃO DE SEGURANÇA (AUTENTICAÇÃO)
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
    
    // Cabeçalho da Credencial
    const cardHeader = document.getElementById('user_card_header');
    const avatarInitials = document.getElementById('avatar_initials');
    const cardTitle = document.getElementById('card_title');
    const userRoleDisplay = document.getElementById('user_role_display');
    
    // Corpo da Credencial (Dados Funcionais)
    const infoNome = document.getElementById('info_nome');
    const infoEmail = document.getElementById('info_email');
    const infoCorporacao = document.getElementById('info_corporacao');
    const infoPatente = document.getElementById('info_patente');
    const infoPermissao = document.getElementById('info_permissao');
    
    // Novos Elementos Mapeados (CPF e Telefone)
    const infoCpf = document.getElementById('info_cpf');
    const infoTelefone = document.getElementById('info_telefone');

    // Botões
    const btnEncerrarSessao = document.getElementById('btn_encerrar_sessao');
    const btnEditarPerfil = document.getElementById('btn_editar_perfil');

    // ==========================================
    // 3. PREENCHIMENTO DOS DADOS E LÓGICA DE TEMA
    // ==========================================

    // Textos Básicos
    cardTitle.textContent = usuario.nome;
    userRoleDisplay.textContent = `${usuario.tipo_militar} - ${usuario.corporacao}`;
    
    infoNome.textContent = usuario.nome;
    infoEmail.textContent = usuario.email;
    infoCorporacao.textContent = usuario.corporacao;
    infoPatente.textContent = usuario.tipo_militar;
    
    // ==========================================
    // LÓGICA NOVA: PROTEÇÃO DE DADOS SENSÍVEIS (LGPD)
    // ==========================================
    
    // 1. Tratamento do Telefone (Se vier apenas números da API, formata visualmente)
    let telefoneFormatado = usuario.telefone || 'Não informado';
    if (telefoneFormatado !== 'Não informado' && telefoneFormatado.length >= 10) {
        // Exemplo: 85999999999 -> (85) 99999-9999
        telefoneFormatado = telefoneFormatado.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
    }
    if (infoTelefone) infoTelefone.textContent = telefoneFormatado;

    // 2. Máscara de Segurança do CPF (Exibe apenas os últimos dígitos)
    let cpfMascarado = '***.***.***-**';
    if (usuario.cpf && usuario.cpf.length === 11) {
        // Pega os dois últimos dígitos do CPF e mascara o resto
        const ultimosDigitos = usuario.cpf.slice(-2);
        cpfMascarado = `***.***.***-${ultimosDigitos}`;
    }
    if (infoCpf) infoCpf.textContent = cpfMascarado;


    // Nível de Acesso
    const permissao = usuario.nivel_acesso || 'Operacional';
    infoPermissao.textContent = permissao;

    // Gerador de Iniciais do Avatar
    const partesNome = usuario.nome.trim().split(' ');
    let iniciais = '';
    if (partesNome.length > 1) {
        iniciais = partesNome[0].charAt(0) + partesNome[partesNome.length - 1].charAt(0);
    } else {
        iniciais = usuario.nome.substring(0, 2);
    }
    avatarInitials.textContent = iniciais.toUpperCase();

    // Injeção do Tema por Corporação
    cardHeader.classList.remove('theme-pm', 'theme-cbm', 'theme-gm');
    
    const corporacao = usuario.corporacao.toUpperCase();
    if (corporacao === 'PM') {
        cardHeader.classList.add('theme-pm');
    } else if (corporacao === 'CBM') {
        cardHeader.classList.add('theme-cbm');
    } else if (corporacao === 'GM') {
        cardHeader.classList.add('theme-gm');
    }

    // ==========================================
    // 4. LÓGICA DOS BOTÕES DE AÇÃO
    // ==========================================

    btnEncerrarSessao.addEventListener('click', () => {
        const confirmar = confirm('Tem certeza que deseja encerrar sua sessão segura?');
        if (confirmar) {
            localStorage.removeItem('usuario');
            window.location.href = 'login.html';
        }
    });

    btnEditarPerfil.addEventListener('click', () => {
        alert('A edição de dados institucionais deve ser solicitada via protocolo interno do RH da sua corporação (Célula de TI).');
    });
});