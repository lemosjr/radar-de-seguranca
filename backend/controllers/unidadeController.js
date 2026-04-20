const pool = require('../config/db');

// ==========================================
// DADOS DE FALLBACK (MODO DE APRESENTAÇÃO)
// Utilizados automaticamente se o PostgreSQL falhar ou estiver vazio.
// ==========================================
const dadosReserva = [
    { nome: '1º CRPM / 5º BPM', corporacao: 'PM', regional: 'Centro', latitude: -3.728330, longitude: -38.528330, efetivo: 250 },
    { nome: '8º BPM (Aldeota)', corporacao: 'PM', regional: 'SER II', latitude: -3.738050, longitude: -38.502220, efetivo: 200 },
    { nome: 'CPChoque / COTAM', corporacao: 'PM', regional: 'SER II', latitude: -3.746110, longitude: -38.461660, efetivo: 400 },
    { nome: '1ª Cia / 1º BBM', corporacao: 'CBM', regional: 'SER I', latitude: -3.725000, longitude: -38.541000, efetivo: 40 },
    { nome: 'Comando Geral BBM', corporacao: 'CBM', regional: 'SER IV', latitude: -3.753000, longitude: -38.533000, efetivo: 80 },
    { nome: 'Torre GM Lagoinha', corporacao: 'GM', regional: 'Centro', latitude: -3.726000, longitude: -38.530000, efetivo: 15 },
    { nome: 'Torre GM Beira Mar', corporacao: 'GM', regional: 'SER II', latitude: -3.728000, longitude: -38.498000, efetivo: 15 }
];

// ==========================================
// CONTROLADOR DE UNIDADES (MAPA)
// ==========================================
exports.buscarUnidades = async (req, res) => {
    const { corporacao, regional } = req.query;
    
    try {
        // 1. TENTATIVA DE BUSCA NO BANCO REAL (POSTGRESQL)
        let query = 'SELECT * FROM unidades_seguranca WHERE 1=1';
        const valores = [];
        let contadorIndex = 1;

        if (corporacao && corporacao !== 'todas') {
            query += ` AND corporacao = $${contadorIndex++}`;
            valores.push(corporacao);
        }

        if (regional && regional !== 'todas') {
            query += ` AND regional = $${contadorIndex++}`;
            valores.push(regional);
        }

        const result = await pool.query(query, valores);
        
        // Estratégia de Apresentação: Se a tabela estiver vazia, força o uso do Mock
        if (result.rows.length === 0) {
            throw new Error('Tabela unidades_seguranca está vazia.');
        }

        // Retorna os dados reais
        return res.status(200).json(result.rows);

    } catch (err) {
        // 2. FALLBACK ATIVADO: BANCO OFFLINE OU VAZIO
        console.warn(`\n🟡 Aviso: Banco indisponível. Usando Modo de Apresentação (Mock). Motivo: ${err.message}`);
        
        let dadosFiltrados = dadosReserva;

        // Mantém a funcionalidade de filtro funcionando com os dados falsos
        if (corporacao && corporacao !== 'todas') {
            dadosFiltrados = dadosFiltrados.filter(unidade => unidade.corporacao === corporacao);
        }
        
        if (regional && regional !== 'todas') {
            dadosFiltrados = dadosFiltrados.filter(unidade => unidade.regional === regional);
        }

        return res.status(200).json(dadosFiltrados);
    }
};