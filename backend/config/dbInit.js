// config/dbInit.js
const db = require('./db');

const initDatabase = async () => {
  try {
    console.log('🔄 Iniciando verificação e configuração do banco de dados...');

    // 1. CRIAÇÃO DA TABELA: usuarios
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
    }

    // 2. CRIAÇÃO DA TABELA: unidades_seguranca
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
      console.log('✅ Tabela "unidades_seguranca" criada!');
      
      // 3. INSERÇÃO DOS DADOS INTEGRADOS (PM, CBM E GMF)
      const insertDataQuery = `
        INSERT INTO unidades_seguranca (nome, corporacao, regional, latitude, longitude, efetivo) VALUES
        -- ================= SER I =================
        ('1ª Cia do 1°BBM (Bombeiros - Jacarecanga)', 'CBM', 'SER I', -3.722000, -38.541000, 50),
        ('Batalhão de Segurança Patrimonial (BSP)', 'PM', 'SER I', -3.724000, -38.543000, 90),
        ('20º BPM (Cristo Redentor)', 'PM', 'SER I', -3.715000, -38.565000, 210),
        ('Torre GM Goiabeiras (Barra do Ceará)', 'GM', 'SER I', -3.705000, -38.580000, 12),
        ('Torre GM Vila Velha', 'GM', 'SER I', -3.722000, -38.595000, 12),
        ('Torre GM Barra do Ceará', 'GM', 'SER I', -3.706000, -38.583000, 12),

        -- ================= SER II =================
        ('Batalhão de Policiamento Turístico (BPTUR)', 'PM', 'SER II', -3.726000, -38.498000, 180),
        ('1ª CPG - Casa Militar', 'PM', 'SER II', -3.727000, -38.496000, 60),
        ('8º BPM (Aldeota)', 'PM', 'SER II', -3.738000, -38.502000, 240),
        ('22º BPM (Papicu)', 'PM', 'SER II', -3.736000, -38.480000, 190),
        ('2ª CPG - Assembleia Legislativa', 'PM', 'SER II', -3.745000, -38.499000, 50),
        ('BSMar (Cais do Porto)', 'CBM', 'SER II', -3.718000, -38.475000, 60),
        ('CPChoque / COTAM / BOPE', 'PM', 'SER II', -3.746000, -38.461000, 450),
        ('Torre GM Caça e Pesca', 'GM', 'SER II', -3.738000, -38.448000, 12),
        ('Torre GM Vicente Pinzon', 'GM', 'SER II', -3.733000, -38.471000, 12),
        ('Torre GM Iracema', 'GM', 'SER II', -3.722000, -38.516000, 12),

        -- ================= SER III =================
        ('CPRAIO (São Gerardo)', 'PM', 'SER III', -3.732000, -38.555000, 320),
        ('18º BPM (Antônio Bezerra)', 'PM', 'SER III', -3.736000, -38.580000, 200),
        ('Torre GM Bonsucesso', 'GM', 'SER III', -3.766000, -38.578000, 12),

        -- ================= SER IV =================
        ('Comando de Bombeiro da Capital (CBC)', 'CBM', 'SER IV', -3.753000, -38.533000, 90),
        ('1º BBM (Parreão)', 'CBM', 'SER IV', -3.753500, -38.533500, 110),
        ('6º BPM (Parangaba)', 'PM', 'SER IV', -3.770000, -38.560000, 230),
        ('Inspetoria GOE (Gentilândia)', 'GM', 'SER IV', -3.748000, -38.536000, 45),

        -- ================= SER V =================
        ('5ª Cia do 1º BBM (Conjunto Ceará)', 'CBM', 'SER V', -3.765000, -38.600000, 55),
        ('17º BPM (Conjunto Ceará)', 'PM', 'SER V', -3.768000, -38.605000, 210),
        ('Torre GM Canindezinho', 'GM', 'SER V', -3.799000, -38.601000, 12),

        -- ================= SER VI =================
        ('Regimento de Polícia Montada (RPMONT)', 'PM', 'SER VI', -3.808000, -38.485000, 150),
        ('16º BPM (Messejana)', 'PM', 'SER VI', -3.832000, -38.492000, 240),
        ('Torre GM Jangurussu', 'GM', 'SER VI', -3.834000, -38.513000, 12),
        ('Torre GM Pôr do Sol', 'GM', 'SER VI', -3.818000, -38.487000, 12),
        ('Inspetoria IPAM (Itaperi)', 'GM', 'SER VI', -3.791000, -38.542000, 35),

        -- ================= CENTRO =================
        ('Batalhão de Busca e Salvamento (BBS)', 'CBM', 'Centro', -3.720000, -38.535000, 80),
        ('5º BPM (Centro)', 'PM', 'Centro', -3.730000, -38.527000, 250),
        ('Inspetoria GTAM (Centro)', 'GM', 'Centro', -3.728000, -38.533000, 40),
        ('Inspetoria GCICLO (Centro)', 'GM', 'Centro', -3.734000, -38.524000, 35);
      `;
      await db.query(insertDataQuery);
      console.log('✅ Dados reais integrados (PM, CBM e GMF) inseridos!');
    }

    console.log('🎉 Banco de dados inicializado com sucesso!');
    if (require.main === module) process.exit(0);

  } catch (err) {
    console.error('❌ Erro crítico:', err.message);
    if (require.main === module) process.exit(1);
  }
};

if (require.main === module) initDatabase();
module.exports = initDatabase;