var express = require("express");
var router = express.Router();

var cloudController = require("../controllers/cloudController");

router.post("/enviar/:filename", function (req, res) {
    cloudController.send(req, res);
})

module.exports = router;