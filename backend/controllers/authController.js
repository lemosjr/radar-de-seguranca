const pool = require('../config/db');

// Lógica de Registro de Usuário (Create)
exports.registrar = async (req, res) => {
    const { nome, email, senha } = req.body;
    
    try {
        const result = await pool.query(
            'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email',
            [nome, email, senha]
        );
        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') { 
            return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
        }
        console.error('Erro no registro:', err.message);
        res.status(500).json({ error: 'Erro interno ao registrar usuário.' });
    }
};

// Lógica de Login (Read/Auth)
exports.login = async (req, res) => {
    const { email, senha } = req.body;
    
    try {
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1 AND senha = $2',
            [email, senha]
        );
        
        if (result.rows.length > 0) {
            res.json({ success: true, user: { id: result.rows[0].id, nome: result.rows[0].nome } });
        } else {
            res.status(401).json({ error: 'E-mail ou senha inválidos.' });
        }
    } catch (err) {
        console.error('Erro no login:', err.message);
        res.status(500).json({ error: 'Erro interno ao realizar login.' });
    }
};