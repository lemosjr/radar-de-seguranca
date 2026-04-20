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
    
    // Textos
    const bannerText = document.getElementById('banner_text');

    // Inputs Dinâmicos e de Máscara
    const selectCorporacao = document.getElementById('reg_corporacao');
    const selectPatente = document.getElementById('reg_patente');
    const inputCpf = document.getElementById('reg_cpf');
    const inputTelefone = document.getElementById('reg_telefone');

    // ==========================================
    // 2. CONFIGURAÇÕES E DADOS GLOBAIS
    // ==========================================
    
    let tentativasLogin = 0;
    const MAX_TENTATIVAS = 3;

    const hierarquiaMilitar = {
        'PM': ['Soldado', 'Cabo', 'Sargento', 'Subtenente', 'Tenente', 'Capitão', 'Major', 'Tenente-Coronel', 'Coronel'],
        'CBM': ['Soldado', 'Cabo', 'Sargento', 'Subtenente', 'Tenente', 'Capitão', 'Major', 'Tenente-Coronel', 'Coronel'],
        'GM': ['Guarda', 'Subinspetor', 'Inspetor']
    };

    // ==========================================
    // 3. UTILITÁRIOS E MÁSCARAS (Clean Code)
    // ==========================================

    const validarDominioInstitucional = (email) => {
        const dominiosPermitidos = ['@sspds.ce.gov.br', '@policiamilitar.ce.gov.br', '@bombeiros.ce.gov.br'];
        return dominiosPermitidos.some(dominio => email.toLowerCase().endsWith(dominio));
    };

    const mostrarMensagem = (elementoId, mensagem, cor = '#d32f2f') => {
        const el = document.getElementById(elementoId);
        el.textContent = mensagem;
        el.style.color = cor;
        el.classList.remove('sr_only');
    };

    // Máscara de CPF: 000.000.000-00
    const aplicarMascaraCPF = (valor) => {
        return valor
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    // Máscara de Telefone: (00) 00000-0000
    const aplicarMascaraTelefone = (valor) => {
        return valor
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4,5})(\d{4})/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    };

    if (inputCpf) inputCpf.addEventListener('input', (e) => e.target.value = aplicarMascaraCPF(e.target.value));
    if (inputTelefone) inputTelefone.addEventListener('input', (e) => e.target.value = aplicarMascaraTelefone(e.target.value));

    // ==========================================
    // 4. LÓGICA DE INTERFACE (Navegação)
    // ==========================================
    
    toggleBtn.addEventListener('click', () => {
        formForgot.classList.add('hidden');
        formForgot.classList.remove('active');

        if (formLogin.classList.contains('active')) {
            formLogin.classList.replace('active', 'hidden');
            formRegister.classList.replace('hidden', 'active');
            bannerText.textContent = 'Já faz parte da nossa rede? Acesse sua conta com suas credenciais.';
            toggleBtn.textContent = 'FAZER LOGIN';
        } else {
            formRegister.classList.replace('active', 'hidden');
            formLogin.classList.replace('hidden', 'active');
            bannerText.textContent = 'Para manter-se conectado de forma segura, por favor faça login com suas credenciais institucionais.';
            toggleBtn.textContent = 'CRIAR CONTA';
        }
    });

    linkEsqueciSenha.addEventListener('click', (e) => {
        e.preventDefault();
        formLogin.classList.replace('active', 'hidden');
        formForgot.classList.replace('hidden', 'active');
    });

    linkVoltarLogin.addEventListener('click', (e) => {
        e.preventDefault();
        formForgot.classList.replace('active', 'hidden');
        formLogin.classList.replace('hidden', 'active');
    });

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
    // 5. COMUNICAÇÃO COM A API
    // ==========================================

    // A. LOGIN
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (tentativasLogin >= MAX_TENTATIVAS) {
            return mostrarMensagem('login_error', 'Acesso bloqueado temporariamente por excesso de tentativas. Contate o administrador.');
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
                tentativasLogin = 0; 
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
            mostrarMensagem('login_error', '🔴 Falha crítica: Servidor da SSPDS indisponível. Tente novamente mais tarde.');
        }
    });

    // B. CADASTRO
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('reg_email').value;

        if (!validarDominioInstitucional(email)) {
            return mostrarMensagem('reg_error', 'Erro: Utilize apenas e-mails institucionais autorizados (@sspds.ce.gov.br, etc).');
        }

        const bodyData = {
            nome: document.getElementById('reg_nome').value,
            cpf: inputCpf.value, // Agora enviamos o CPF
            telefone: inputTelefone.value, // E o Telefone
            email: email,
            corporacao: selectCorporacao.value,
            tipo_militar: selectPatente.value,
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
            mostrarMensagem('reg_error', '🔴 Falha crítica: Servidor indisponível no momento.');
        }
    });

    // C. RECUPERAÇÃO DE SENHA
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
                mostrarMensagem('forgot_msg', data.message, '#00b37e'); 
                formForgot.reset();
            } else {
                mostrarMensagem('forgot_msg', data.error || 'Erro ao processar a solicitação.');
            }
        } catch (error) {
            mostrarMensagem('forgot_msg', '🔴 Falha crítica: Serviço de e-mail indisponível.');
        }
    });
});