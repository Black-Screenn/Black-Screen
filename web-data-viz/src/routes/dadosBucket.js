var express = require("express");
var router = express.Router();
var dadosBucketController = require("../controllers/dadosBucketController");

router.get("/dashboard", function(req, res) {
    dadosBucketController.buscarDadosDashboard(req, res);
});

module.exports = router;