const pool = require('../config/db');
const bcrypt = require('bcrypt'); // Adicionado para proteção das senhas

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

// Registro de Usuário com Validação Robusta e Criptografia
exports.registrar = async (req, res) => {
    // Recebendo os novos campos do frontend
    const { nome, cpf, telefone, email, senha, corporacao, tipo_militar } = req.body;
    
    // Clean Code: Early Return para validação de campos obrigatórios
    if (!nome || !cpf || !telefone || !email || !senha || !corporacao || !tipo_militar) {
        return res.status(400).json({ success: false, error: 'Todos os campos são obrigatórios para o cadastro.' });
    }

    // Validação da Senha Forte no Servidor (Defesa em Profundidade)
    const regexSenha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!regexSenha.test(senha)) {
        return res.status(400).json({ success: false, error: 'A senha não atende aos requisitos mínimos de segurança.' });
    }

    // Cálculo automático do nível de permissão no servidor
    const nivel = permissoesMapeadas[corporacao]?.[tipo_militar] || 1;

    try {
        // Verificação dupla: Impede CPF ou E-mail duplicados
        const userCheck = await pool.query(
            'SELECT id FROM usuarios WHERE email = $1 OR cpf = $2',
            [email, cpf]
        );

        if (userCheck.rows.length > 0) {
            return res.status(409).json({ success: false, error: 'Este e-mail ou CPF já está cadastrado no sistema.' });
        }

        // Criptografando a senha antes de salvar
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        // Inserção no banco com a nova estrutura da tabela
        const result = await pool.query(
            `INSERT INTO usuarios (nome, cpf, telefone, email, senha_hash, corporacao, tipo_militar, nivel_acesso) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, nome, email, corporacao, tipo_militar, nivel_acesso`,
            [nome, cpf, telefone, email, senhaHash, corporacao, tipo_militar, nivel]
        );
        
        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('Erro no registro:', err);
        res.status(500).json({ success: false, error: 'Erro interno ao processar cadastro.' });
    }
};

// Lógica de Esquecer Senha (Mantida e intacta)
exports.solicitarRecuperacao = async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'O e-mail é necessário para recuperar a senha.' });
    }

    try {
        const userCheck = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        
        if (userCheck.rows.length > 0) {
            console.log(`Log: Solicitação de reset de senha para ${email}`);
        }
        
        res.json({ success: true, message: 'Se o e-mail existir na base, um link de recuperação será enviado.' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao processar recuperação de senha.' });
    }
};

// Login com verificação de Hash
exports.login = async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios.' });
    }

    try {
        // Busca o usuário apenas pelo email
        const result = await pool.query(
            'SELECT id, nome, email, corporacao, tipo_militar, nivel_acesso, senha_hash FROM usuarios WHERE email = $1',
            [email]
        );
        
        // Se não encontrou o email, para aqui
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
        }

        const usuario = result.rows[0];

        // Compara a senha digitada com a criptografia do banco
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaValida) {
            return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
        }

        // Por segurança, removemos o hash da memória antes de enviar ao frontend
        delete usuario.senha_hash;

        res.json({ success: true, user: usuario });
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ success: false, error: 'Erro no servidor durante o login.' });
    }
};