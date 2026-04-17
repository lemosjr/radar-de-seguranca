document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. MAPEAMENTO DE ELEMENTOS DO DOM
    // ==========================================
    
    // Formulários
    const formLogin = document.getElementById('form_login');
    const formRegister = document.getElementById('form_register');
    const formForgot = document.getElementById('form_forgot');
    
    // Botões e Links
    const toggleBtn = document.getElementById('toggle_btn');
    const linkEsqueciSenha = document.getElementById('link_esqueci_senha');
    const linkVoltarLogin = document.getElementById('link_voltar_login');
    
    // Textos do Banner
    const bannerText = document.getElementById('banner_text');

    // Selects Dinâmicos do Cadastro
    const selectCorporacao = document.getElementById('reg_corporacao');
    const selectPatente = document.getElementById('reg_patente');

    // ==========================================
    // 2. VARIÁVEIS DE SEGURANÇA E DADOS
    // ==========================================
    
    // Controle de Força Bruta
    let tentativasLogin = 0;
    const MAX_TENTATIVAS = 3;

    // Dados para os selects dinâmicos
    const hierarquiaMilitar = {
        'PM': ['Soldado', 'Cabo', 'Sargento', 'Subtenente', 'Tenente', 'Capitão', 'Major', 'Tenente-Coronel', 'Coronel'],
        'CBM': ['Soldado', 'Cabo', 'Sargento', 'Subtenente', 'Tenente', 'Capitão', 'Major', 'Tenente-Coronel', 'Coronel'],
        'GM': ['Guarda', 'Subinspetor', 'Inspetor']
    };

    // ==========================================
    // 3. LÓGICA DE INTERFACE E VALIDAÇÃO (UI)
    // ==========================================

    // PONTO 1: Função de Validação de Domínio Institucional
    function validarDominioInstitucional(email) {
        const dominiosPermitidos = ['@sspds.ce.gov.br', '@policiamilitar.ce.gov.br', '@bombeiros.ce.gov.br'];
        return dominiosPermitidos.some(dominio => email.toLowerCase().endsWith(dominio));
    }
    
    // Alternar entre Login e Cadastro
    toggleBtn.addEventListener('click', () => {
        formForgot.classList.add('hidden');
        formForgot.classList.remove('active');

        if (formLogin.classList.contains('active')) {
            // Vai para Registro
            formLogin.classList.remove('active');
            formLogin.classList.add('hidden');
            formRegister.classList.remove('hidden');
            formRegister.classList.add('active');
            
            bannerText.textContent = 'Já faz parte da nossa rede? Acesse sua conta com suas credenciais.';
            toggleBtn.textContent = 'FAZER LOGIN';
        } else {
            // Vai para Login
            formRegister.classList.remove('active');
            formRegister.classList.add('hidden');
            formLogin.classList.remove('hidden');
            formLogin.classList.add('active');
            
            bannerText.textContent = 'Para manter-se conectado de forma segura, por favor faça login com suas credenciais institucionais.';
            toggleBtn.textContent = 'CRIAR CONTA';
        }
    });

    // Abrir formulário de Esquecer Senha
    linkEsqueciSenha.addEventListener('click', (e) => {
        e.preventDefault();
        formLogin.classList.remove('active');
        formLogin.classList.add('hidden');
        formForgot.classList.remove('hidden');
        formForgot.classList.add('active');
    });

    // Voltar para o Login
    linkVoltarLogin.addEventListener('click', (e) => {
        e.preventDefault();
        formForgot.classList.remove('active');
        formForgot.classList.add('hidden');
        formLogin.classList.remove('hidden');
        formLogin.classList.add('active');
    });

    // Select Dinâmico (Corporação -> Patentes)
    selectCorporacao.addEventListener('change', function() {
        const corporacaoSelecionada = this.value;
        
        selectPatente.innerHTML = '<option value="" disabled selected>Selecione o posto/graduação</option>';
        
        if (corporacaoSelecionada && hierarquiaMilitar[corporacaoSelecionada]) {
            hierarquiaMilitar[corporacaoSelecionada].forEach(patente => {
                const opt = document.createElement('option');
                opt.value = patente;
                opt.textContent = patente;
                selectPatente.appendChild(opt);
            });
            selectPatente.disabled = false;
        } else {
            selectPatente.disabled = true;
        }
    });

    // ==========================================
    // 4. LÓGICA DE COMUNICAÇÃO COM A API
    // ==========================================

    // Função DRY para exibir mensagens
    function mostrarMensagem(elementoId, mensagem, cor = '#d32f2f') {
        const el = document.getElementById(elementoId);
        el.textContent = mensagem;
        el.style.color = cor;
        el.classList.remove('sr_only');
    }

    // A. Requisitar Login
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        // PONTO 6: Proteção contra Força Bruta
        if (tentativasLogin >= MAX_TENTATIVAS) {
            mostrarMensagem('login_error', 'Acesso bloqueado temporariamente por excesso de tentativas. Contate o administrador.');
            return;
        }

        const email = document.getElementById('login_email').value;
        const senha = document.getElementById('login_password').value; 

        try {
            const res = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });
            
            const data = await res.json();

            if (res.ok && data.success) {
                tentativasLogin = 0; // Reseta as tentativas após o sucesso
                localStorage.setItem('usuario', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } else {
                tentativasLogin++;
                const tentativasRestantes = MAX_TENTATIVAS - tentativasLogin;
                
                if (tentativasRestantes > 0) {
                    mostrarMensagem('login_error', `${data.error || 'Credenciais inválidas.'} Você tem mais ${tentativasRestantes} tentativa(s).`);
                } else {
                    mostrarMensagem('login_error', 'Acesso bloqueado temporariamente por excesso de tentativas.');
                }
            }
        } catch (error) {
            // PONTO 5: Tratamento de Exceção Crítico (Servidor Fora)
            mostrarMensagem('login_error', '🔴 Falha crítica: Servidor da SSPDS indisponível. Tente novamente mais tarde.');
        }
    });

    // B. Requisitar Cadastro
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('reg_email').value;

        // PONTO 1: Validação Rigorosa de E-mail Institucional no Cadastro
        if (!validarDominioInstitucional(email)) {
            mostrarMensagem('reg_error', 'Erro: Utilize apenas e-mails institucionais autorizados (@sspds.ce.gov.br, etc).');
            return;
        }

        // PONTO 2: O checkbox de Termos de Uso já é validado nativamente pelo HTML (required),
        // mas a lógica de envio prossegue apenas se ele foi marcado.

        const bodyData = {
            nome: document.getElementById('reg_nome').value,
            email: email,
            corporacao: document.getElementById('reg_corporacao').value,
            tipo_militar: document.getElementById('reg_patente').value,
            senha: document.getElementById('reg_password').value
        };

        try {
            const res = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });
            
            const data = await res.json();

            if (res.ok && data.success) {
                alert('Cadastro solicitado com sucesso! Você já pode fazer login.');
                formRegister.reset();
                toggleBtn.click(); // Volta para tela de login
            } else {
                mostrarMensagem('reg_error', data.error || 'Falha ao realizar cadastro.');
            }
        } catch (error) {
            // PONTO 5: Tratamento de Exceção Crítico (Servidor Fora)
            mostrarMensagem('reg_error', '🔴 Falha crítica: Servidor indisponível no momento.');
        }
    });

    // C. Requisitar Recuperação de Senha
    formForgot.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot_email').value;

        try {
            const res = await fetch('http://localhost:3000/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const data = await res.json();

            if (res.ok && data.success) {
                mostrarMensagem('forgot_msg', data.message, '#00b37e'); // Cor verde
                formForgot.reset();
            } else {
                mostrarMensagem('forgot_msg', data.error || 'Erro ao processar a solicitação.');
            }
        } catch (error) {
            // PONTO 5: Tratamento de Exceção Crítico (Servidor Fora)
            mostrarMensagem('forgot_msg', '🔴 Falha crítica: Serviço de e-mail indisponível.');
        }
    });
});