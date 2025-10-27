var componenteModel = require("../models/componenteModel");

function cadastrar(req, res) {
    var componente = req.body.componenteServer;
    var caixa = req.body.caixaServer;
    var unidade = req.body.unidadeServer;
    var parametro = req.body.parametroServer;

    if (componente == undefined) {
        res.status(400).send("Seu componente está undefined!");
    } else if (caixa == undefined) {
        res.status(400).send("A caixa está undefined!");
    } else if (unidade == undefined) {
        res.status(400).send("A unidade está undefined!");
    } else if (parametro == undefined) {
        res.status(400).send("O parâmetro está undefined!");
    } else {
        componenteModel.cadastrar(componente, caixa, unidade, parametro)
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

function listar(req, res) {
    var fkEmpresa = req.headers.fk_empresa;

    if (fkEmpresa == undefined) {
        res.status(400).send("Empresa não informada!");
    } else {
        componenteModel.listar(fkEmpresa)
            .then(function (resultado) {
                if (resultado.length > 0) {
                    res.status(200).json(resultado);
                } else {
                    res.status(204).send("Nenhum componente encontrado!");
                }
            })
            .catch(function (erro) {
                console.log(erro);
                console.log("Houve um erro ao buscar os componentes: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function editar(req, res) {
    var idComponente = req.body.idComponente;
    var componente = req.body.componenteServer;
    var unidade = req.body.unidadeServer;
    var parametro = req.body.parametroServer;

    if (idComponente == undefined) {
        res.status(400).send("ID do componente está undefined!");
    } else if (componente == undefined) {
        res.status(400).send("Nome do componente está undefined!");
    } else if (unidade == undefined) {
        res.status(400).send("Unidade está undefined!");
    } else if (parametro == undefined) {
        res.status(400).send("Parâmetro está undefined!");
    } else {
        componenteModel.editar(idComponente, componente, unidade, parametro)
            .then(function (resultado) {
                res.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                console.log("Houve um erro ao editar o componente: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function excluir(req, res) {
    var idComponente = req.params.id;

    if (idComponente == undefined) {
        res.status(400).send("ID do componente está undefined!");
    } else {
        componenteModel.excluir(idComponente)
            .then(function (resultado) {
                res.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                console.log("Houve um erro ao excluir o componente: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

module.exports = {
    cadastrar,
    listar,
    editar,
    excluir
}