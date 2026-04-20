const express = require('express');
const unidadeController = require('../controllers/unidadeController');

const router = express.Router();

// ==========================================
// ROTAS DE UNIDADES (MAPA/DASHBOARD)
// ==========================================

router.get('/', unidadeController.buscarUnidades);

module.exports = router;