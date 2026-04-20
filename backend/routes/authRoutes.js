const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================

router.post('/register', authController.registrar);
router.post('/login', authController.login);
router.post('/forgot-password', authController.solicitarRecuperacao);

module.exports = router;