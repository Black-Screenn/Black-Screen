var express = require("express");
var router = express.Router();
var dadosBucketController = require("../controllers/dadosBucketController");

router.get("/processos", function(req, res) {
    dadosBucketController.buscarProcessos(req, res);
});

module.exports = router;