const express = require('express');
const router = express.Router();

const { gerarRelatorio, listarRelatorios } = require('../controllers/relatorioController.js');

router.post('/gerar', gerarRelatorio);

router.post('/listar', listarRelatorios);

module.exports = router;