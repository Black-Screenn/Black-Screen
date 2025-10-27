var express = require("express");
var router = express.Router();

var componenteController = require("../controllers/componenteController");

router.post("/cadastrar", function (req, res) {
    componenteController.cadastrar(req, res);
});

router.get("/listar", function (req, res) {
    componenteController.listar(req, res);
});

router.put("/editar", function (req, res) {
    componenteController.editar(req, res);
});

router.delete("/excluir/:id", function (req, res) {
    componenteController.excluir(req, res);
});

module.exports = router;