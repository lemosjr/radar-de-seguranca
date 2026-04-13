const { Pool } = require('pg');
require('dotenv').config();

// Configuração do pool de conexões com o PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

// Teste de conexão inicial para facilitar o debug
pool.connect((erro, client, release) => {
    if (erro) {
        console.error('Erro ao conectar ao banco de dados PostgreSQL', erro.stack);
    } else {
        console.log('Conexão com o banco de dados estabelecida com sucesso!');
    }
    if (client) release();
});

module.exports = pool;