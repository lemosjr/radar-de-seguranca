document.addEventListener('DOMContentLoaded', () => {
    // Captura dos Elementos de UI
    const toggleBtn = document.getElementById('toggle_btn');
    const bannerText = document.getElementById('banner_text'); // Mantemos apenas o texto menor
    
    const formLogin = document.getElementById('form_login');
    const formRegister = document.getElementById('form_register');
    
    const loginError = document.getElementById('login_error');
    const regError = document.getElementById('reg_error');

    // ==========================================
    // 1. Alternar entre Login e Cadastro
    // ==========================================
    toggleBtn.addEventListener('click', () => {
        const isLoginActive = formLogin.classList.contains('active');

        if (isLoginActive) {
            // Se está no Login, vai para a tela de Cadastro
            formLogin.classList.remove('active');
            formLogin.classList.add('hidden');
            formRegister.classList.remove('hidden');
            formRegister.classList.add('active');

            // Atualiza apenas o texto descritivo do Banner Verde
            bannerText.innerText = 'Cadastre-se no sistema do Radar de Segurança utilizando seu e-mail institucional.';
            
            // Força a mudança do texto do botão
            toggleBtn.innerText = 'FAZER LOGIN';
            
            loginError.innerText = '';
            regError.innerText = '';
        } else {
            // Se está no Cadastro, volta para a tela de Login
            formRegister.classList.remove('active');
            formRegister.classList.add('hidden');
            formLogin.classList.remove('hidden');
            formLogin.classList.add('active');

            // Atualiza apenas o texto descritivo do Banner Verde
            bannerText.innerText = 'Para manter-se conectado de forma segura, por favor faça login com suas credenciais institucionais.';
            
            // Força a mudança do texto do botão
            toggleBtn.innerText = 'CRIAR CONTA';
            
            loginError.innerText = '';
            regError.innerText = '';
        }
    });

    // ==========================================
    // 2. Lógica de Submissão do Login
    // ==========================================
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        loginError.style.color = "#008959";
        loginError.innerText = 'Autenticando...';
        
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
                localStorage.setItem('usuarioOperacional', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } else {
                loginError.style.color = "#d32f2f";
                loginError.innerText = data.error || 'Erro ao realizar login.';
            }
        } catch (error) {
            loginError.style.color = "#d32f2f";
            loginError.innerText = 'Erro de conexão com o servidor. Verifique se o backend está rodando.';
        }
    });

    // ==========================================
    // 3. Lógica de Submissão do Registro
    // ==========================================
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        regError.style.color = "#008959";
        regError.innerText = 'Registrando agente...';
        
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
                regError.innerText = '';
                alert('Conta criada com sucesso! Faça login para acessar o sistema.');
                
                // Volta para a tela de login automaticamente
                toggleBtn.click(); 
                document.getElementById('form_register').reset();
            } else {
                regError.style.color = "#d32f2f";
                regError.innerText = data.error || 'Erro ao realizar o cadastro.';
            }
        } catch (error) {
            regError.style.color = "#d32f2f";
            regError.innerText = 'Erro de conexão com o servidor. Verifique se o backend está rodando.';
        }
    });
});