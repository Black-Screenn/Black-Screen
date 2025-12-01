var express = require("express");
var router = express.Router();

var caixaController = require("../controllers/caixaController");
const { pingTcp } = require("../controllers/ping.js");

router.get("/listar", caixaController.listar);
router.get(
  "/buscarInfoCaixa/:macaddress",
  caixaController.buscarInfoCaixaBuckeet,
);
router.get("/buscarchamado", caixaController.buscarChamado);
router.post("/buscarchamado", caixaController.buscarChamado);
router.get("/listarinfo", caixaController.listarInfo);
router.get("/localizacao/:mac", caixaController.buscarPorMac);
router.post("/cadastrar", function (req, res) {
  caixaController.cadastrar(req, res);
});
router.post("/ping", async (req, res) => {
  try {
    const result = await pingTcp();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Ping failed" });
  }
});

module.exports = router;
