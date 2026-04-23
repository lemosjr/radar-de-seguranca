/**
 * HEADER.JS - Módulo Centralizado do Menu Hambúrguer
 * Controla o comportamento do menu lateral em todas as páginas
 * 
 * Princípio DRY: Este código é compartilhado entre todas as páginas
 * que possuem o menu hambúrguer (dashboard, usuario, sobre, etc)
 */

(function() {
    'use strict';

    // ==========================================
    // 1. CONFIGURAÇÃO DO MENU LATERAL
    // ==========================================
    function configurarMenuLateral() {
        const btnMenu = document.getElementById('hamburger');
        const btnClose = document.getElementById('sidebar_close');
        const sidebar = document.getElementById('sidebar_nav');
        const overlay = document.getElementById('nav_overlay');

        // Verifica se os elementos existem na página
        if (!btnMenu || !sidebar || !overlay) {
            // Menu não encontrado nesta página (ex: login.html)
            return;
        }

        function abrirMenu() {
            sidebar.classList.add('is_open');
            overlay.classList.add('is_visible');
            btnMenu.setAttribute('aria-expanded', 'true');
            sidebar.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            document.body.classList.add('sidebar-open');
        }

        function fecharMenu() {
            sidebar.classList.remove('is_open');
            overlay.classList.remove('is_visible');
            btnMenu.setAttribute('aria-expanded', 'false');
            sidebar.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            document.body.classList.remove('sidebar-open');
        }

        function toggleMenu() {
            if (sidebar.classList.contains('is_open')) {
                fecharMenu();
            } else {
                abrirMenu();
            }
        }

        // Event Listeners
        btnMenu.addEventListener('click', toggleMenu);
        
        if (btnClose) {
            btnClose.addEventListener('click', fecharMenu);
        }
        
        overlay.addEventListener('click', fecharMenu);
        
        // Fechar com tecla ESC
        document.addEventListener('keydown', (e) => { 
            if (e.key === 'Escape' && sidebar.classList.contains('is_open')) {
                fecharMenu();
            }
        });
    }

    // ==========================================
    // 2. CONFIGURAÇÃO DO PERFIL DO USUÁRIO
    // ==========================================
    function configurarPerfilUsuario() {
        const sessaoUsuario = localStorage.getItem('usuario');
        
        if (!sessaoUsuario) return;
        
        const utilizador = JSON.parse(sessaoUsuario);
        
        // Elementos do cabeçalho
        const elNome = document.getElementById('dash_user_name');
        const elRole = document.getElementById('dash_user_role');
        const elInitials = document.getElementById('dash_user_initials');
        const btnLogout = document.getElementById('btn_logout_dash');

        if (elNome) elNome.textContent = utilizador.nome || 'Agente';
        if (elRole) elRole.textContent = `${utilizador.tipo_militar || ''} ${utilizador.corporacao || ''}`.trim();
        
        if (elInitials && utilizador.nome) {
            const partes = utilizador.nome.trim().split(' ');
            elInitials.textContent = partes.length > 1 
                ? (partes[0][0] + partes[partes.length - 1][0]).toUpperCase() 
                : utilizador.nome.substring(0, 2).toUpperCase();
        }

        // Logout
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                if (confirm('Tem certeza que deseja encerrar a sessão segura?')) {
                    localStorage.removeItem('usuario');
                    window.location.href = 'login.html';
                }
            });
        }
    }

    // ==========================================
    // 3. VERIFICAÇÃO DE AUTENTICAÇÃO
    // ==========================================
    function verificarAutenticacao() {
        const sessaoUsuario = localStorage.getItem('usuario');
        const paginasProtegidas = ['dashboard.html', 'usuario.html', 'sobre.html'];
        const paginaAtual = window.location.pathname.split('/').pop();
        
        // Se estiver em uma página protegida e não estiver logado, redireciona
        if (paginasProtegidas.includes(paginaAtual) && !sessaoUsuario) {
            window.location.href = 'login.html';
            return false;
        }
        
        return !!sessaoUsuario;
    }

    // ==========================================
    // 4. INICIALIZAÇÃO
    // ==========================================
    function init() {
        verificarAutenticacao();
        configurarPerfilUsuario();
        configurarMenuLateral();
    }

    // Aguarda o DOM carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();