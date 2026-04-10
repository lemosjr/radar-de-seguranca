document.addEventListener('DOMContentLoaded', () => {
    // Elementos de UI
    const toggleBtn = document.getElementById('toggle_btn');
    const bannerTitle = document.getElementById('banner_title');
    const bannerText = document.getElementById('banner_text');
    
    const formLogin = document.getElementById('form_login');
    const formRegister = document.getElementById('form_register');
    
    const loginError = document.getElementById('login_error');
    const regError = document.getElementById('reg_error');

    let isLoginView = true;

    // Alternar entre Login e Cadastro
    toggleBtn.addEventListener('click', () => {
        isLoginView = !isLoginView;

        if (isLoginView) {
            formRegister.classList.remove('active');
            formRegister.classList.add('hidden');
            formLogin.classList.remove('hidden');
            formLogin.classList.add('active');

            bannerTitle.textContent = 'Bem-vindo de volta!';
            bannerText.textContent = 'Para manter-se conectado de forma segura, por favor faça login com suas credenciais institucionais.';
            toggleBtn.textContent = 'CRIAR CONTA';
            
            // Limpa mensagens de erro
            loginError.textContent = '';
            regError.textContent = '';
        } else {
            formLogin.classList.remove('active');
            formLogin.classList.add('hidden');
            formRegister.classList.remove('hidden');
            formRegister.classList.add('active');

            bannerTitle.textContent = 'Novo por aqui?';
            bannerText.textContent = 'Cadastre-se no sistema do Radar de Segurança utilizando seu e-mail institucional.';
            toggleBtn.textContent = 'FAZER LOGIN';
            
            // Limpa mensagens de erro
            loginError.textContent = '';
            regError.textContent = '';
        }
    });

    // Lógica de Login
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        
        const email = document.getElementById('login_email').value;
        const senha = document.getElementById('login_password').value;

        try {
            const res = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await res.json();

            if (res.ok) {
                // Sucesso: Redireciona para o painel
                window.location.href = 'dashboard.html';
            } else {
                loginError.textContent = data.error || 'Erro ao realizar login.';
            }
        } catch (error) {
            loginError.textContent = 'Erro de conexão com o servidor.';
        }
    });

    // Lógica de Registro
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        regError.textContent = '';
        
        const nome = document.getElementById('reg_nome').value;
        const email = document.getElementById('reg_email').value;
        const senha = document.getElementById('reg_password').value;

        try {
            const res = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha })
            });

            const data = await res.json();

            if (res.ok) {
                alert('Conta criada com sucesso! Faça login para continuar.');
                // Força a voltar para a tela de login
                toggleBtn.click(); 
                document.getElementById('form_register').reset();
            } else {
                regError.textContent = data.error || 'Erro ao realizar o cadastro.';
            }
        } catch (error) {
            regError.textContent = 'Erro de conexão com o servidor.';
        }
    });
});