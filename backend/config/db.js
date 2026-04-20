const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

// Validação da conexão durante a inicialização do servidor
pool.connect((err, client, release) => {
    if (err) {
        console.error('Falha na conexão com o banco de dados:', err.message);
    } else {
        console.log('Conexão com PostgreSQL estabelecida com sucesso.');
        release();
    }
});

module.exports = pool;