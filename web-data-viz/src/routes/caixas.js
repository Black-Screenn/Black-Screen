var express = require("express");
var router = express.Router();

var caixaController = require("../controllers/caixaController")

router.get("/listar", caixaController.listar);
router.post("/cadastrar", function (req, res) {
    caixaController.cadastrar(req, res);
});

module.exports = router;

