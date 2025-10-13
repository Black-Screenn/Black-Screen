var usuarioModel = require("../models/usuarioModel");

async function autenticar(req, res) {
  const email = req.body.emailServer;
  const senha = req.body.senhaServer;

  if (email == undefined) return res.status(400).send("Seu email está undefined!");
  if (senha == undefined) return res.status(400).send("Sua senha está indefinida!");

  try {
    const resultado = await usuarioModel.autenticar(email, senha);
    if (resultado.length !== 1) {
      return res.status(403).send("Email e/ou senha inválido(s)");
    }

    const u = resultado[0];
    req.session.usuario = { idUsuario: u.idUsuario, nome: u.nome, fkEmpresa: u.fkEmpresa };

    return res.json({
      ok: true,
      idUsuario: u.idUsuario,
      nome: u.nome,
      email: u.email,
      fkEmpresa: u.fkEmpresa
    });
  } catch (e) {
  console.error("X [AUTH] login:", e.code, e.sqlMessage || e.message);
  if (process.env.AMBIENTE_PROCESSO === "desenvolvimento") {
    return res.status(500).json({
      erro: "Falha no login",
      code: e.code,
      msg: e.sqlMessage || e.message,
      sql: e.sql
    });
  }
  return res.status(500).json({ erro: "Falha no login" });
}
}



function cadastrar(req, res) {
    var nome = req.body.nomeServer;
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;

    if (nome == undefined) {
        res.status(400).send("Seu nome está undefined!");
    } else if (email == undefined) {
        res.status(400).send("Seu email está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("Sua senha está undefined!");
    } else {

        usuarioModel.cadastrar(nome, email, senha)
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

function trocar(req, res) {
    var idUsuario = req.body.idUsuario;       
    var senhaAtual = req.body.senhaAtual;
    var novaSenha = req.body.novaSenha;

    if (idUsuario == undefined) {
        res.status(400).send("Seu ID está undefined!");
    } else if (senhaAtual == undefined) {
        res.status(400).send("Sua senha atual está indefinida!");
    } else if (novaSenha == undefined) {
        res.status(400).send("Sua nova senha está indefinida!");
    } else {
        usuarioModel.validarSenha(idUsuario, senhaAtual)
            .then((resultado) => {
                if (resultado.length == 1) {
                    usuarioModel.trocar(idUsuario, novaSenha)
                        .then((resultadoUpdate) => {
                            res.json({ mensagem: "Senha alterada com sucesso!" });
                        })
                        .catch((erro) => {
                            console.log(erro);
                            console.log("Erro ao trocar a senha: ", erro.sqlMessage);
                            res.status(500).json(erro.sqlMessage);
                        });
                } else {
                    res.status(403).send("Senha atual incorreta!");
                }
            })
            .catch((erro) => {
                console.log(erro);
                console.log("Erro ao validar a senha atual: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function excluir(req, res) {
    var idUsuario = req.body.idUsuario;

    if (idUsuario == undefined) {
        res.status(400).send("Seu ID está undefined!");
    } else {
        usuarioModel.excluir(idUsuario)
            .then(() => {
                res.json({ mensagem: "Conta excluída com sucesso!" });
            })
            .catch((erro) => {
                console.log(erro);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

module.exports = {
    autenticar,
    cadastrar,
    trocar,
    excluir
}