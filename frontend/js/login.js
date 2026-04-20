document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. MAPEAMENTO DE ELEMENTOS (UI)
    // ==========================================
    const DOM = {
        formLogin:    document.getElementById('form_login'),
        formRegister: document.getElementById('form_register'),
        formForgot:   document.getElementById('form_forgot'),
        toggleBtn:    document.getElementById('toggle_btn'),
        bannerText:   document.getElementById('banner_text'),
        inputCpf:     document.getElementById('reg_cpf'),
        inputTel:     document.getElementById('reg_telefone'),
        selCorp:      document.getElementById('reg_corporacao'),
        selPatente:   document.getElementById('reg_patente'),
        links: {
            esqueci: document.getElementById('link_esqueci_senha'),
            voltar:  document.getElementById('link_voltar_login')
        }
    };

    // ==========================================
    // 2. CONFIGURAÇÕES E UTILITÁRIOS
    // ==========================================
    let tentativasLogin = 0;
    const MAX_TENTATIVAS = 3;

    const HIERARQUIA = {
        'PM':  ['Soldado', 'Cabo', 'Sargento', 'Subtenente', 'Tenente', 'Capitão', 'Major', 'Tenente-Coronel', 'Coronel'],
        'CBM': ['Soldado', 'Cabo', 'Sargento', 'Subtenente', 'Tenente', 'Capitão', 'Major', 'Tenente-Coronel', 'Coronel'],
        'GM':  ['Guarda', 'Subinspetor', 'Inspetor']
    };

    const UI = {
        exibirMsg: (id, msg, cor = '#d32f2f') => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = msg;
                el.style.color = cor;
                el.classList.remove('sr_only');
            }
        },
        limparMsgs: () => {
            document.querySelectorAll('.error_msg').forEach(el => el.classList.add('sr_only'));
        }
    };

    // ==========================================
    // 3. MÁSCARAS DE INPUT (UX)
    // ==========================================
    const Mascaras = {
        cpf: (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1'),
        tel: (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4,5})(\d{4})/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1')
    };

    DOM.inputCpf?.addEventListener('input', (e) => e.target.value = Mascaras.cpf(e.target.value));
    DOM.inputTel?.addEventListener('input', (e) => e.target.value = Mascaras.tel(e.target.value));

    // ==========================================
    // 4. LÓGICA DE NAVEGAÇÃO E INTERFACE
    // ==========================================
    DOM.toggleBtn?.addEventListener('click', () => {
        UI.limparMsgs();
        const isLoginAtivo = DOM.formLogin.classList.contains('active');

        DOM.formForgot.classList.add('hidden');
        
        if (isLoginAtivo) {
            DOM.formLogin.classList.replace('active', 'hidden');
            DOM.formRegister.classList.replace('hidden', 'active');
            DOM.bannerText.textContent = 'Já faz parte da nossa rede? Acesse sua conta com suas credenciais.';
            DOM.toggleBtn.textContent = 'FAZER LOGIN';
        } else {
            DOM.formRegister.classList.replace('active', 'hidden');
            DOM.formLogin.classList.replace('hidden', 'active');
            DOM.bannerText.textContent = 'Para manter-se conectado de forma segura, faça login com as suas credenciais.';
            DOM.toggleBtn.textContent = 'CRIAR CONTA';
        }
    });

    DOM.selCorp?.addEventListener('change', (e) => {
        const patente = DOM.selPatente;
        patente.innerHTML = '<option value="" disabled selected>Selecione o posto/graduação</option>';
        
        if (HIERARQUIA[e.target.value]) {
            HIERARQUIA[e.target.value].forEach(p => {
                const opt = document.createElement('option');
                opt.value = opt.textContent = p;
                patente.appendChild(opt);
            });
            patente.disabled = false;
        }
    });

    // ==========================================
    // 5. COMUNICAÇÃO COM A API (BACKEND)
    // ==========================================

    // A. LOGIN
    DOM.formLogin?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (tentativasLogin >= MAX_TENTATIVAS) return UI.exibirMsg('login_error', 'Bloqueio temporário por excesso de tentativas.');

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
                localStorage.setItem('usuario', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } else {
                tentativasLogin++;
                UI.exibirMsg('login_error', data.error || 'Credenciais inválidas.');
            }
        } catch (err) {
            UI.exibirMsg('login_error', '🔴 Servidor indisponível.');
        }
    });

    // B. REGISTO
    DOM.formRegister?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('reg_email').value;
        const dominiosValidos = ['@sspds.ce.gov.br', '@policiamilitar.ce.gov.br', '@bombeiros.ce.gov.br'];

        if (!dominiosValidos.some(d => email.toLowerCase().endsWith(d))) {
            return UI.exibirMsg('reg_error', 'Utilize um e-mail institucional válido.');
        }

        const payload = {
            nome: document.getElementById('reg_nome').value,
            cpf: DOM.inputCpf.value,
            telefone: DOM.inputTel.value,
            email,
            corporacao: DOM.selCorp.value,
            tipo_militar: DOM.selPatente.value,
            senha: document.getElementById('reg_password').value
        };

        try {
            const res = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            if (res.ok && data.success) {
                alert('Registo concluído! Faça login agora.');
                DOM.toggleBtn.click();
            } else {
                UI.exibirMsg('reg_error', data.error || 'Erro no registo.');
            }
        } catch (err) {
            UI.exibirMsg('reg_error', '🔴 Erro de rede.');
        }
    });
});