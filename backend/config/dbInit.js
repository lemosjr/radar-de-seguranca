// config/dbInit.js
const db = require('./db'); // Importa a conexão com o banco de dados

// Script SQL para criar as tabelas
const createTables = async () => {
  try {
    // 1. Verificar e criar tabela usuarios
    const checkUsuariosTable = `SELECT to_regclass('public.usuarios');`;
    const usuariosResult = await db.query(checkUsuariosTable);

    if (usuariosResult.rows[0].to_regclass === null) {
      const createUsuariosQuery = `
        CREATE TABLE usuarios (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(150) NOT NULL, 
            cpf VARCHAR(14) UNIQUE NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            telefone VARCHAR(15) NOT NULL,
            corporacao VARCHAR(10) NOT NULL,
            tipo_militar VARCHAR(50) NOT NULL,
            senha_hash VARCHAR(255) NOT NULL,
            nivel_acesso VARCHAR(20) DEFAULT 'operacional',
            termos_aceitos BOOLEAN DEFAULT FALSE,
            data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await db.query(createUsuariosQuery);
      console.log('✅ Tabela "usuarios" criada com sucesso!');
    } else {
      console.log('ℹ️ Tabela "usuarios" já existe.');
    }

    // 2. Verificar e criar tabela unidades_seguranca
    const checkUnidadesTable = `SELECT to_regclass('public.unidades_seguranca');`;
    const unidadesResult = await db.query(checkUnidadesTable);

    if (unidadesResult.rows[0].to_regclass === null) {
      const createUnidadesQuery = `
        CREATE TABLE unidades_seguranca (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(150) NOT NULL,
            corporacao VARCHAR(10) NOT NULL,
            regional VARCHAR(50) NOT NULL,
            latitude DECIMAL(10, 8) NOT NULL,
            longitude DECIMAL(10, 8) NOT NULL,
            efetivo INTEGER DEFAULT 0
        );
      `;
      await db.query(createUnidadesQuery);
      console.log('✅ Tabela "unidades_seguranca" criada com sucesso!');
      
      // 3. Inserir dados iniciais na tabela unidades_seguranca
      const insertDataQuery = `
        INSERT INTO unidades_seguranca (nome, corporacao, regional, latitude, longitude, efetivo) VALUES
        ('1º CRPM / 5º BPM', 'PM', 'Centro', -3.728330, -38.528330, 250),
        ('8º BPM (Aldeota)', 'PM', 'SER II', -3.738050, -38.502220, 200),
        ('CPChoque / COTAM', 'PM', 'SER II', -3.746110, -38.461660, 400),
        ('1ª Cia / 1º BBM', 'CBM', 'SER I', -3.725000, -38.541000, 40),
        ('Comando Geral BBM', 'CBM', 'SER IV', -3.753000, -38.533000, 80),
        ('Torre GM Lagoinha', 'GM', 'Centro', -3.726000, -38.530000, 15),
        ('Torre GM Beira Mar', 'GM', 'SER II', -3.728000, -38.498000, 15)
        ON CONFLICT (id) DO NOTHING;
      `;
      await db.query(insertDataQuery);
      console.log('✅ Dados iniciais inseridos em "unidades_seguranca"!');
    } else {
      console.log('ℹ️ Tabela "unidades_seguranca" já existe.');
    }

    console.log('🎉 Banco de dados inicializado com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao criar tabelas:', err.message);
  }
};

// Executar a função se este arquivo for chamado diretamente
if (require.main === module) {
  createTables().catch(console.error);
}

module.exports = createTables;