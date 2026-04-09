const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rota principal para buscar as unidades
app.get('/api/unidades', async (req, res) => {
    try {
        const { corporacao, regional } = req.query;
        
        // Constrói a query dinamicamente baseada nos filtros
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
        console.error(err.message);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});