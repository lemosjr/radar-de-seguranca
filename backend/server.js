const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importando os nossos Roteadores
const unidadeRoutes = require('./routes/unidadeRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ==========================================
// REGISTRO DE ROTAS
// ==========================================
// Toda requisição para /api/unidades vai para o unidadeRoutes
app.use('/api/unidades', unidadeRoutes);

// Toda requisição para /api vai para o authRoutes (login e register)
app.use('/api', authRoutes); 

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando perfeitamente na porta ${PORT} 🚀`);
    console.log(`Arquitetura MVC implementada com sucesso!`);
});