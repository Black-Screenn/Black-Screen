var express = require("express");
var router = express.Router();

var cloudController = require("../controllers/cloudController");

router.post("/enviar/:filename", function (req, res) {
  cloudController.send(req, res);
});

router.get("/visualizarRelatorio/:id", cloudController.acessarRelatorio);
router.get("/buscaCSVgrafico", function (req, res) {
  cloudController.buscaCSVgrafico(req, res);
});

module.exports = router;
