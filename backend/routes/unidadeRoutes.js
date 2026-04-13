const express = require('express');
const router = express.Router();
const unidadeController = require('../controllers/unidadeController');

// Quando o frontend chamar GET /api/unidades, ele dispara o controlador
router.get('/', unidadeController.buscarUnidades);

module.exports = router;