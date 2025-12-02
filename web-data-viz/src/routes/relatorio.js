const express = require('express');
const router = express.Router();

const { gerarRelatorio, listarRelatorios, avaliarRelatorio } = require('../controllers/relatorioController.js');

router.post('/gerar', gerarRelatorio);

router.post('/listar', listarRelatorios);

router.post('/avaliar', avaliarRelatorio);

module.exports = router;