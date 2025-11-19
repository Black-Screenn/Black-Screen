const express = require('express');
const router = express.Router();

// 1. Importa seu controller
const { gerarRelatorio } = require('../controllers/relatorioController.js');

router.get('/gerar', gerarRelatorio);

module.exports = router;