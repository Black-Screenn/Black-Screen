var componenteModel = require("../models/componenteModel");

function cadastrar(req, res) {
    var componente = req.body.componenteServer;
    var unidade = req.body.unidadeServer;

    if (componente == undefined) {
        res.status(400).send("Seu componente está undefined!");
    } else if (unidade == undefined) {
        res.status(400).send("Seu email está undefined!");
    }  else {

        componenteModel.cadastrar(componente, unidade)//, fkEmpresa
            .then(
                function (resultado) {
                    res.json(resultado);
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log(
                        "\nHouve um erro ao realizar o cadastro! Erro: ",
                        erro.sqlMessage
                    );
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }
}

module.exports = {
    cadastrar
}