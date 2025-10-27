const caixaModel = require("../models/caixaModel");

async function listar(req, res) {
  try {
    const fk = req.headers["fk_empresa"];
    console.log("fkEmpresa na sessão:", fk);

    if (fk === undefined) {
      return res.status(401).json({ erro: "Sessão inválida" });
    }

    const fkNum = Number(fk);
    if (!Number.isInteger(fkNum)) {
      return res.status(400).json({ erro: "fkEmpresa inválida na sessão" });
    }

    const dados = await caixaModel.listarPorEmpresa(fkNum);
    return res.status(200).json(dados);

  } catch (e) {
    console.error("X [CAIXAS] erro:", e.code, e.sqlMessage || e.message);
    return res.status(500).json({ erro: "Falha ao consultar caixas" });
  }
}

async function cadastrar(req, res) {
  try {
    const caixa = req.body.dataframe[0]; 
    console.log(caixa)
    if (caixa === undefined) {
      return res.status(400).json({ erro: "Caixa inválido" });
    }

    if (caixa.idEmpresa == null || caixa.idEmpresa == "" ) {
      return res.status(400).json({ erro: "ID da Empresa inválido" });
    }

    await caixaModel.cadastrar(caixa);
    return res.status(200).json({ 
      message: "Cadastro feito com sucesso",
      caixa: caixa
    });

  } catch (e) {
    console.error("X [CAIXAS] erro:", e.code, e.sqlMessage || e.message);
    return res.status(500).json({ erro: "Falha ao consultar caixas" });
  }
}

module.exports = { listar, cadastrar };
