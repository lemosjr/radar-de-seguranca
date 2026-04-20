// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();

// const authRoutes = require('./routes/authRoutes');
// const unidadeRoutes = require('./routes/unidadeRoutes');

// const app = express();

// // ==========================================
// // MIDDLEWARES GLOBAIS
// // ==========================================
// app.use(cors());
// app.use(express.json());

// // ==========================================
// // REGISTRO DE ROTAS
// // ==========================================
// app.use('/api', authRoutes); 
// app.use('/api/unidades', unidadeRoutes);

// // ==========================================
// // INICIALIZAÇÃO DO SERVIDOR
// // ==========================================
// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//     console.log(`🚀 Servidor SSPDS inicializado com sucesso na porta ${PORT}`);
// });

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const unidadeRoutes = require('./routes/unidadeRoutes');
const initDatabase = require('./config/dbInit'); // Importa a inicialização do banco

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

// Função para inicializar o servidor após o banco de dados estar pronto
const startServer = async () => {
  try {
    // Inicializa as tabelas do banco de dados
    await initDatabase();
    
    // Inicia o servidor apenas se o banco foi inicializado com sucesso
    app.listen(PORT, () => {
      console.log(`🚀 Servidor SSPDS inicializado com sucesso na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar o banco de dados:', error.message);
    process.exit(1); // Encerra o processo se não conseguir conectar ao banco
  }
};

// Inicia o servidor
startServer();