const caixaModel = require("../models/caixaModel");

async function listar(req, res) {
  try {
    const fk = req.session?.usuario?.fkEmpresa; 

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

module.exports = { listar };
