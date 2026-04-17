document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. VERIFICAÇÃO DE SEGURANÇA (AUTENTICAÇÃO)
    // ==========================================
    
    // Recupera os dados do usuário salvos no momento do login
    const usuarioString = localStorage.getItem('usuario');
    
    // Se não houver dados, significa que o usuário não está logado
    if (!usuarioString) {
        // Redireciona imediatamente para a tela de login para proteção da rota
        window.location.href = 'login.html';
        return; 
    }

    // Converte a string JSON de volta para um objeto JavaScript utilizável
    const usuario = JSON.parse(usuarioString);

    // ==========================================
    // 2. MAPEAMENTO DE ELEMENTOS DO DOM
    // ==========================================
    
    // Elementos do Cabeçalho do Cartão
    const cardHeader = document.getElementById('user_card_header');
    const avatarInitials = document.getElementById('avatar_initials');
    const cardTitle = document.getElementById('card_title');
    const userRoleDisplay = document.getElementById('user_role_display');
    
    // Elementos do Corpo do Cartão
    const infoNome = document.getElementById('info_nome');
    const infoEmail = document.getElementById('info_email');
    const infoCorporacao = document.getElementById('info_corporacao');
    const infoPatente = document.getElementById('info_patente');
    const infoPermissao = document.getElementById('info_permissao');
    
    // Botões de Ação
    const btnEncerrarSessao = document.getElementById('btn_encerrar_sessao');
    const btnEditarPerfil = document.getElementById('btn_editar_perfil');

    // ==========================================
    // 3. PREENCHIMENTO DOS DADOS E LÓGICA DE TEMA
    // ==========================================

    // A. Preenche as informações textuais básicas
    cardTitle.textContent = usuario.nome;
    userRoleDisplay.textContent = `${usuario.tipo_militar} - ${usuario.corporacao}`;
    
    infoNome.textContent = usuario.nome;
    infoEmail.textContent = usuario.email;
    infoCorporacao.textContent = usuario.corporacao;
    infoPatente.textContent = usuario.tipo_militar;
    
    // B. Define o Nível de Acesso (Se o backend não enviar, definimos um padrão)
    const permissao = usuario.nivel_acesso || 'Operacional';
    infoPermissao.textContent = permissao;

    // C. Lógica para gerar as iniciais do Avatar
    const partesNome = usuario.nome.trim().split(' ');
    let iniciais = '';
    if (partesNome.length > 1) {
        // Pega a primeira letra do primeiro nome e a primeira letra do último nome
        iniciais = partesNome[0].charAt(0) + partesNome[partesNome.length - 1].charAt(0);
    } else {
        // Se tiver só um nome, pega as duas primeiras letras
        iniciais = usuario.nome.substring(0, 2);
    }
    avatarInitials.textContent = iniciais.toUpperCase();

    // D. Injeção do Tema Baseado na Corporação
    // Remove qualquer tema que possa estar no HTML e aplica o correto
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

    // Encerrar Sessão (Logout)
    btnEncerrarSessao.addEventListener('click', () => {
        const confirmar = confirm('Tem certeza que deseja encerrar sua sessão segura?');
        
        if (confirmar) {
            // Remove o usuário da memória local
            localStorage.removeItem('usuario');
            // Redireciona para o login
            window.location.href = 'login.html';
        }
    });

    // Atualizar Dados (Apenas exemplo de alerta, pode ser expandido futuramente)
    btnEditarPerfil.addEventListener('click', () => {
        alert('A edição de dados institucionais deve ser solicitada via protocolo interno do RH da sua respectiva corporação.');
    });
});