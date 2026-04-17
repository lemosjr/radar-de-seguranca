const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rotas principais de acesso e criação de conta
router.post('/register', authController.registrar);
router.post('/login', authController.login);

// Nova rota para a funcionalidade pedida pelo professor
router.post('/forgot-password', authController.solicitarRecuperacao);

module.exports = router;