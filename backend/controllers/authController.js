const pool = require('../config/db');

/**
 * MAPEAMENTO DE HIERARQUIA E PERMISSÕES
 * Centralizamos os dados aqui para seguir o princípio DRY. 
 * Níveis: 1 (Operacional), 2 (Supervisão), 3 (Comando/Gestão).
 */
const permissoesMapeadas = {
    'PM': { 'Soldado': 1, 'Cabo': 1, 'Sargento': 2, 'Subtenente': 2, 'Tenente': 2, 'Capitão': 3, 'Major': 3, 'Tenente-Coronel': 3, 'Coronel': 3 },
    'CBM': { 'Soldado': 1, 'Cabo': 1, 'Sargento': 2, 'Subtenente': 2, 'Tenente': 2, 'Capitão': 3, 'Major': 3, 'Tenente-Coronel': 3, 'Coronel': 3 },
    'GM': { 'Guarda': 1, 'Subinspetor': 2, 'Inspetor': 3 }
};

// Registro de Usuário com Validação de Campos Obrigatórios
exports.registrar = async (req, res) => {
    const { nome, email, senha, corporacao, tipo_militar } = req.body;
    
    // Clean Code: Early Return para validação de campos obrigatórios
    if (!nome || !email || !senha || !corporacao || !tipo_militar) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios para o cadastro.' });
    }

    // Cálculo automático do nível de permissão no servidor por segurança
    const nivel = permissoesMapeadas[corporacao]?.[tipo_militar] || 1;

    try {
        const result = await pool.query(
            `INSERT INTO usuarios (nome, email, senha, corporacao, tipo_militar, nivel_permissao) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nome, email, corporacao`,
            [nome, email, senha, corporacao, tipo_militar, nivel]
        );
        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') { 
            return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
        }
        res.status(500).json({ error: 'Erro interno ao processar cadastro.' });
    }
};

// Lógica de Esquecer Senha (Preparação de Endpoint)
exports.solicitarRecuperacao = async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'O e-mail é necessário para recuperar a senha.' });
    }

    try {
        const userCheck = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        
        if (userCheck.rows.length > 0) {
            // Aqui seria implementado o envio de e-mail real via Nodemailer futuramente
            console.log(`Log: Solicitação de reset de senha para ${email}`);
        }
        
        // Por segurança, sempre retornamos a mesma mensagem para evitar descoberta de e-mails
        res.json({ success: true, message: 'Se o e-mail existir na base, um link de recuperação será enviado.' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao processar recuperação de senha.' });
    }
};

// O login permanece similar, mas agora retorna também a corporação e o nível para o frontend adaptar a visão
exports.login = async (req, res) => {
    const { email, senha } = req.body;
    try {
        const result = await pool.query(
            'SELECT id, nome, corporacao, nivel_permissao FROM usuarios WHERE email = $1 AND senha = $2',
            [email, senha]
        );
        
        if (result.rows.length > 0) {
            res.json({ success: true, user: result.rows[0] });
        } else {
            res.status(401).json({ error: 'Credenciais inválidas.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Erro no servidor durante o login.' });
    }
};