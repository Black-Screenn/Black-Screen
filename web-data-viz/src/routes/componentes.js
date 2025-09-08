var express = require("express");
var router = express.Router();

var componenteController = require("../controllers/componenteController");

router.post("/cadastrar", function (req, res) {
    componenteController.cadastrar(req, res);
})

module.exports = router;