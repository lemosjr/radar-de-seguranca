const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();

// Middlewares de segurança e formatação
// O CORS permite que o frontend acesse essa API sem bloqueios do navegador
app.use(cors());
// O express.json permite que o servidor entenda dados enviados no formato JSON (como no login)
app.use(express.json());

// ==========================================
// ROTAS DE DADOS (Dashboard)
// ==========================================

// Rota para buscar as unidades de segurança com suporte a filtros dinâmicos
app.get('/api/unidades', async (req, res) => {
    try {
        const { corporacao, regional } = req.query;
        
        let query = 'SELECT * FROM unidades_seguranca WHERE 1=1';
        const valores = [];
        let index = 1;

        if (corporacao && corporacao !== 'todas') {
            query += ` AND corporacao = $${index}`;
            valores.push(corporacao);
            index++;
        }

        if (regional && regional !== 'todas') {
            query += ` AND regional = $${index}`;
            valores.push(regional);
            index++;
        }

        const result = await pool.query(query, valores);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar unidades:', err.message);
        res.status(500).json({ error: 'Erro no servidor ao buscar dados.' });
    }
});

// ==========================================
// ROTAS DE AUTENTICAÇÃO (Usuários)
// ==========================================

// Rota de Registro (Create)
app.post('/api/register', async (req, res) => {
    const { nome, email, senha } = req.body;
    
    try {
        const result = await pool.query(
            'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email',
            [nome, email, senha]
        );
        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (err) {
        // Código 23505 no Postgres significa violação de chave única, ou seja, e-mail já cadastrado
        if (err.code === '23505') { 
            return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
        }
        console.error('Erro no registro:', err.message);
        res.status(500).json({ error: 'Erro interno ao registrar usuário.' });
    }
});

// Rota de Login (Read/Auth)
app.post('/api/login', async (req, res) => {
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
});

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando perfeitamente na porta ${PORT} 🚀`);
});