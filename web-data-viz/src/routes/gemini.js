var express = require("express");
var router = express.Router();

var geminiController = require("../controllers/geminiController");

router.post("/prompt", function(req, res)
{
    geminiController.prompt(req,res);
});


module.exports = router;