var express = require("express");
var router = express.Router();

var cargoController = require("../controllers/cargoController")

router.get("/listar", cargoController.listar);
router.post("/cadastrar", function (req, res) {
    cargoController.cadastrar(req, res);
});

module.exports = router;

