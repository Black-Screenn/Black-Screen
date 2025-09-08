var componenteModel = require("../models/componenteModel");

function cadastrar(req, res) {
    // Crie uma variável que vá recuperar os valores do arquivo cadastro.html
    var componente = req.body.componenteServer;
    var unidade = req.body.unidadeServer;
    //var fkEmpresa = req.body.idEmpresaVincularServer;

    // Faça as validações dos valores
    if (componente == undefined) {
        res.status(400).send("Seu componente está undefined!");
    } else if (unidade == undefined) {
        res.status(400).send("Seu email está undefined!");
    }  /*else if (fkEmpresa == undefined) {
        res.status(400).send("Sua empresa a vincular está undefined!");
    } */else {

        // Passe os valores como parâmetro e vá para o arquivo componenteModel.js
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