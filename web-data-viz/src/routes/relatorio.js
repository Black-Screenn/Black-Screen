const express = require('express');
const router = express.Router();

// 1. Importa seu controller
const { gerarRelatorio, listarRelatorios } = require('../controllers/relatorioController.js');

router.post('/gerar', gerarRelatorio);

router.post('/listar', listarRelatorios);

module.exports = router;