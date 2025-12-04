const express = require('express');
const router = express.Router();
// const path = require('path');

const s3Controller = require('../script/s3');

// router.get('/:arquivo', (req, res) => {
//   s3Controller.lerArquivo(req, res);
// });

router.get('/dados', (req, res) => {
  // Simula como se o arquivo viesse na URL
  req.params.arquivo = process.env.ARQUIVO;
  s3Controller.lerArquivo(req, res);
});

module.exports = router;
