// Importamos o seu arquivo de banco de dados
const pool = require('../config/db');

// ==========================================
// MODO APRESENTAÇÃO (PLANO B)
// Dados mockados caso o PostgreSQL falhe
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

// Lógica para buscar os dados (Antiga rota do seu server.js)
exports.buscarUnidades = async (req, res) => {
    const { corporacao, regional } = req.query;
    
    try {
        // 1. TENTA O POSTGRESQL PRIMEIRO
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
        
        // Se a tabela estiver vazia, forçamos um erro para cair no Plano B
        if(result.rows.length === 0) throw new Error("Tabela vazia");

        // Se deu tudo certo, devolve os dados reais
        res.json(result.rows);

    } catch (err) {
        // 2. SE O BANCO CAIR OU ESTIVER VAZIO, ENTRA O PLANO B AUTOMATICAMENTE
        console.log('🟡 Banco indisponível. Usando Modo de Apresentação (Mock).');
        
        let dadosFiltrados = dadosReserva;

        // O filtro do Leaflet continua funcionando perfeitamente com os dados falsos
        if (corporacao && corporacao !== 'todas') {
            dadosFiltrados = dadosFiltrados.filter(u => u.corporacao === corporacao);
        }
        if (regional && regional !== 'todas') {
            dadosFiltrados = dadosFiltrados.filter(u => u.regional === regional);
        }

        res.json(dadosFiltrados);
    }
};