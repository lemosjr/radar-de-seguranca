const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const unidadeRoutes = require('./routes/unidadeRoutes');

const app = express();

// ==========================================
// MIDDLEWARES GLOBAIS
// ==========================================
app.use(cors());
app.use(express.json());

// ==========================================
// REGISTRO DE ROTAS
// ==========================================
app.use('/api', authRoutes); 
app.use('/api/unidades', unidadeRoutes);

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor SSPDS inicializado com sucesso na porta ${PORT}`);
});