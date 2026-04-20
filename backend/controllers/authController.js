const pool = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * MAPEAMENTO DE HIERARQUIA E PERMISSÕES
 * Centraliza as regras de negócio de acesso por patente.
 */
const permissoesMapeadas = {
    'PM': { 'Soldado': 'Operacional', 'Cabo': 'Operacional', 'Sargento': 'Supervisão', 'Subtenente': 'Supervisão', 'Tenente': 'Supervisão', 'Capitão': 'Comando', 'Major': 'Comando', 'Tenente-Coronel': 'Comando', 'Coronel': 'Comando' },
    'CBM': { 'Soldado': 'Operacional', 'Cabo': 'Operacional', 'Sargento': 'Supervisão', 'Subtenente': 'Supervisão', 'Tenente': 'Supervisão', 'Capitão': 'Comando', 'Major': 'Comando', 'Tenente-Coronel': 'Comando', 'Coronel': 'Comando' },
    'GM': { 'Guarda': 'Operacional', 'Subinspetor': 'Supervisão', 'Inspetor': 'Comando' }
};

/**
 * Função utilitária para validação de senha segura.
 */
const validarSenhaForte = (senha) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    return regex.test(senha);
};

// ==========================================
// REGISTRO DE USUÁRIO
// ==========================================
exports.registrar = async (req, res) => {
    const { nome, cpf, telefone, email, senha, corporacao, tipo_militar } = req.body;
    
    if (!nome || !cpf || !telefone || !email || !senha || !corporacao || !tipo_militar) {
        return res.status(400).json({ success: false, error: 'Todos os campos são obrigatórios para o cadastro.' });
    }

    if (!validarSenhaForte(senha)) {
        return res.status(400).json({ success: false, error: 'A senha não atende aos requisitos mínimos de segurança.' });
    }

    const nivelAcesso = permissoesMapeadas[corporacao]?.[tipo_militar] || 'Operacional';

    try {
        const userCheck = await pool.query(
            'SELECT id FROM usuarios WHERE email = $1 OR cpf = $2',
            [email, cpf]
        );

        if (userCheck.rows.length > 0) {
            return res.status(409).json({ success: false, error: 'Este e-mail ou CPF já está cadastrado no sistema.' });
        }

        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        const result = await pool.query(
            `INSERT INTO usuarios (nome, cpf, telefone, email, senha_hash, corporacao, tipo_militar, nivel_acesso) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, nome, email, corporacao, tipo_militar, nivel_acesso`,
            [nome, cpf, telefone, email, senhaHash, corporacao, tipo_militar, nivelAcesso]
        );
        
        return res.status(201).json({ success: true, user: result.rows[0] });

    } catch (err) {
        console.error('Erro no registro:', err.message);
        return res.status(500).json({ success: false, error: 'Erro interno ao processar cadastro.' });
    }
};

// ==========================================
// RECUPERAÇÃO DE SENHA
// ==========================================
exports.solicitarRecuperacao = async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ success: false, error: 'O e-mail é necessário para recuperar a senha.' });
    }

    try {
        const userCheck = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        
        if (userCheck.rows.length > 0) {
            console.log(`Log de Sistema: Solicitação de reset de senha recebida para o endereço ${email}`);
        }
        
        return res.status(200).json({ success: true, message: 'Se o e-mail existir na base, um link de recuperação será enviado.' });

    } catch (err) {
        console.error('Erro na recuperação:', err.message);
        return res.status(500).json({ success: false, error: 'Erro ao processar recuperação de senha.' });
    }
};

// ==========================================
// LOGIN E AUTENTICAÇÃO
// ==========================================
exports.login = async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios.' });
    }

    try {
        const result = await pool.query(
            'SELECT id, nome, email, corporacao, tipo_militar, nivel_acesso, senha_hash FROM usuarios WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
        }

        const usuario = result.rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaValida) {
            return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
        }

        delete usuario.senha_hash;

        return res.status(200).json({ success: true, user: usuario });

    } catch (err) {
        console.error('Erro no login:', err.message);
        return res.status(500).json({ success: false, error: 'Erro no servidor durante o login.' });
    }
};