var cargoModel = require("../models/cargoModel");

function cadastrar(req, res) {
    var empresa = req.body.empresa;
    var nomeCargo = req.body.nomeCargo;
    cargoModel.cadastrar(empresa, nomeCargo)
        .then(function (resultado) {
            res.json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            console.log(
                "\nHouve um erro ao cadastrar o cargo! Erro: ",
                erro.sqlMessage
            );
            res.status(500).json(erro.sqlMessage);
        });
}

function listar(req, res) {
    var empresa = req.headers["fk_empresa"];
    cargoModel.listar(empresa)
        .then(function (resultado) {
            res.json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            console.log(
                "\nHouve um erro ao buscar os usuários! Erro: ",
                erro.sqlMessage
            );
            res.status(500).json(erro.sqlMessage);
        });
}

module.exports = {
    cadastrar,
    listar
}