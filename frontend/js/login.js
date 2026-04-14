document.addEventListener('DOMContentLoaded', () => {
    // Captura dos Elementos de UI
    const toggleBtn = document.getElementById('toggle_btn');
    const bannerText = document.getElementById('banner_text'); 
    
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
            formLogin.classList.remove('active');
            formLogin.classList.add('hidden');
            formRegister.classList.remove('hidden');
            formRegister.classList.add('active');

            bannerText.innerText = 'Cadastre-se no sistema do Radar de Segurança utilizando seu e-mail institucional.';
            toggleBtn.innerText = 'FAZER LOGIN';
            
            loginError.innerText = '';
            regError.innerText = '';
        } else {
            formRegister.classList.remove('active');
            formRegister.classList.add('hidden');
            formLogin.classList.remove('hidden');
            formLogin.classList.add('active');

            bannerText.innerText = 'Para manter-se conectado de forma segura, por favor faça login com suas credenciais institucionais.';
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
            // GATILHO OFFLINE: Servidor caiu ou não foi iniciado
            console.warn("Servidor backend offline. Tentando acesso local de emergência...");
            
            if (email === 'admin@sspds.ce.gov.br' && senha === '123456') {
                loginError.style.color = "#008959"; 
                loginError.innerText = 'Modo de Apresentação Ativado! Redirecionando...';
                
                // Cria o usuário mockado no navegador
                localStorage.setItem('usuarioOperacional', JSON.stringify({ 
                    id: 999, 
                    nome: 'Inspetor Chefe (Apresentação)' 
                }));
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                loginError.style.color = "#d32f2f";
                loginError.innerText = 'Servidor offline. Para apresentação, utilize a conta de demonstração (admin@sspds.ce.gov.br).';
            }
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
                toggleBtn.click(); 
                document.getElementById('form_register').reset();
            } else {
                regError.style.color = "#d32f2f";
                regError.innerText = data.error || 'Erro ao realizar o cadastro.';
            }
        } catch (error) {
            // Em modo offline, não é possível criar contas reais no banco
            regError.style.color = "#d32f2f";
            regError.innerText = 'Erro de conexão com o servidor. O registro está indisponível offline.';
        }
    });
});