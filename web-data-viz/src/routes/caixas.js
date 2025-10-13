var express = require("express");
var router = express.Router();

var caixaController = require("../controllers/caixaController")

router.get("/", caixaController.listar);

module.exports = router;

