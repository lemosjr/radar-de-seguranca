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
    
    // Textos e Selects
    const bannerText = document.getElementById('banner_text');
    const selectCorporacao = document.getElementById('reg_corporacao');
    const selectPatente = document.getElementById('reg_patente');

    // ==========================================
    // 2. VARIÁVEIS DE SEGURANÇA E DADOS
    // ==========================================
    
    let tentativasLogin = 0;
    const MAX_TENTATIVAS = 3;

    const hierarquiaMilitar = {
        'PM': ['Soldado', 'Cabo', 'Sargento', 'Subtenente', 'Tenente', 'Capitão', 'Major', 'Tenente-Coronel', 'Coronel'],
        'CBM': ['Soldado', 'Cabo', 'Sargento', 'Subtenente', 'Tenente', 'Capitão', 'Major', 'Tenente-Coronel', 'Coronel'],
        'GM': ['Guarda', 'Subinspetor', 'Inspetor']
    };

    // ==========================================
    // 3. MÁSCARAS DE INPUT (TEMPO REAL)
    // ==========================================

    const inputCpf = document.getElementById('reg_cpf');
    const inputTelefone = document.getElementById('reg_telefone');
    
    // Máscara de CPF (000.000.000-00)
    if (inputCpf) {
        inputCpf.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, ''); 
            if (value.length > 11) value = value.slice(0, 11);
            
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = value;
        });
    }

    // Máscara de Telefone Dinâmica ((00) 00000-0000 ou (00) 0000-0000)
    if (inputTelefone) {
        inputTelefone.addEventListener('input', function(e) {
            let v = e.target.value.replace(/\D/g, ''); 
            if (v.length > 11) v = v.substring(0, 11); 
            
            if (v.length > 2) v = `(${v.substring(0, 2)}) ${v.substring(2)}`;
            if (v.length > 9) v = `${v.substring(0, 10)}-${v.substring(10)}`; 
            else if (v.length > 8) v = `${v.substring(0, 9)}-${v.substring(9)}`; 
            
            e.target.value = v;
        });
    }

    // ==========================================
    // 4. LÓGICA DE INTERFACE (UI) E VALIDAÇÕES
    // ==========================================

    function validarDominioInstitucional(email) {
        const dominiosPermitidos = ['@sspds.ce.gov.br', '@policiamilitar.ce.gov.br', '@bombeiros.ce.gov.br'];
        return dominiosPermitidos.some(dominio => email.toLowerCase().endsWith(dominio));
    }

    function validarSenhaForte(senha) {
        // Exige: 1 Maiúscula, 1 Minúscula, 1 Número, 1 Símbolo, mín. 6 chars
        const regexSenhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
        return regexSenhaForte.test(senha);
    }
    
    // Alternar abas (Login <-> Cadastro)
    toggleBtn.addEventListener('click', () => {
        formForgot.classList.add('hidden');
        formForgot.classList.remove('active');

        if (formLogin.classList.contains('active')) {
            formLogin.classList.remove('active');
            formLogin.classList.add('hidden');
            formRegister.classList.remove('hidden');
            formRegister.classList.add('active');
            bannerText.textContent = 'Já faz parte da nossa rede? Acesse sua conta com suas credenciais.';
            toggleBtn.textContent = 'FAZER LOGIN';
        } else {
            formRegister.classList.remove('active');
            formRegister.classList.add('hidden');
            formLogin.classList.remove('hidden');
            formLogin.classList.add('active');
            bannerText.textContent = 'Para manter-se conectado de forma segura, por favor faça login com suas credenciais institucionais.';
            toggleBtn.textContent = 'CRIAR CONTA';
        }
    });

    // Abrir Esquecer Senha
    linkEsqueciSenha.addEventListener('click', (e) => {
        e.preventDefault();
        formLogin.classList.remove('active');
        formLogin.classList.add('hidden');
        formForgot.classList.remove('hidden');
        formForgot.classList.add('active');
    });

    // Voltar para Login
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
    // 5. LÓGICA DE COMUNICAÇÃO COM A API
    // ==========================================

    function mostrarMensagem(elementoId, mensagem, cor = '#d32f2f') {
        const el = document.getElementById(elementoId);
        el.textContent = mensagem;
        el.style.color = cor;
        el.classList.remove('sr_only');
    }

    // A. Requisitar Login
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

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

    // B. Requisitar Cadastro (Com Validações Robustas)
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('reg_email').value;
        const senha = document.getElementById('reg_password').value;
        const cpfLimpo = document.getElementById('reg_cpf').value.replace(/\D/g, ''); 
        const telefoneLimpo = document.getElementById('reg_telefone').value.replace(/\D/g, ''); 

        // Bloqueios de Validação (Fail Fast)
        if (!validarDominioInstitucional(email)) {
            return mostrarMensagem('reg_error', 'Erro: Utilize apenas e-mails institucionais autorizados (@sspds.ce.gov.br, etc).');
        }
        if (!validarSenhaForte(senha)) {
            return mostrarMensagem('reg_error', 'Erro: A senha não atende aos requisitos mínimos de segurança.');
        }
        if (cpfLimpo.length < 11) {
            return mostrarMensagem('reg_error', 'Erro: Informe um CPF válido completo.');
        }
        if (telefoneLimpo.length < 10) {
            return mostrarMensagem('reg_error', 'Erro: Informe um número de telefone com DDD válido.');
        }

        const bodyData = {
            nome: document.getElementById('reg_nome').value,
            cpf: cpfLimpo,
            telefone: telefoneLimpo,
            email: email,
            corporacao: document.getElementById('reg_corporacao').value,
            tipo_militar: document.getElementById('reg_patente').value,
            senha: senha
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
                toggleBtn.click(); 
            } else {
                mostrarMensagem('reg_error', data.error || 'Falha ao realizar cadastro.');
            }
        } catch (error) {
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