var componenteModel = require("../models/componenteModel");

function cadastrar(req, res) {
    var componente = req.body.componenteServer;
    var fkEmpresa = req.body.empresaServer || req.headers.fk_empresa;
    var unidade = req.body.unidadeServer;
    var parametro = req.body.parametroServer;

    if (componente == undefined) {
        res.status(400).send("Seu componente está undefined!");
    } else if (fkEmpresa == undefined) {
        res.status(400).send("A empresa está undefined!");
    } else if (unidade == undefined) {
        res.status(400).send("A unidade está undefined!");
    } else if (parametro == undefined) {
        res.status(400).send("O parâmetro está undefined!");
    } else {
        componenteModel.cadastrar(componente, fkEmpresa, unidade, parametro)
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

function associarCaixa(req, res) {
    var idComponente = req.body.idComponente;
    var idCaixa = req.body.idCaixa;

    if (idComponente == undefined) {
        res.status(400).send("ID do componente está undefined!");
    } else if (idCaixa == undefined) {
        res.status(400).send("ID da caixa está undefined!");
    } else {
        componenteModel.associarCaixa(idComponente, idCaixa)
            .then(function (resultado) {
                res.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                console.log("Houve um erro ao associar o componente: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function desassociarCaixa(req, res) {
    var idComponente = req.body.idComponente;
    var idCaixa = req.body.idCaixa;

    if (idComponente == undefined) {
        res.status(400).send("ID do componente está undefined!");
    } else if (idCaixa == undefined) {
        res.status(400).send("ID da caixa está undefined!");
    } else {
        componenteModel.desassociarCaixa(idComponente, idCaixa)
            .then(function (resultado) {
                res.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                console.log("Houve um erro ao desassociar o componente: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function listarPorCaixa(req, res) {
    var idCaixa = req.params.idCaixa;

    if (idCaixa == undefined) {
        res.status(400).send("ID da caixa está undefined!");
    } else {
        componenteModel.listarPorCaixa(idCaixa)
            .then(function (resultado) {
                res.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                console.log("Houve um erro ao listar componentes da caixa: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

module.exports = {
    cadastrar,
    listar,
    editar,
    excluir,
    associarCaixa,
    desassociarCaixa,
    listarPorCaixa
}