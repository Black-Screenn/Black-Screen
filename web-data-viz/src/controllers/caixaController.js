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

async function buscarPorMac(req, res) {
  try {
    const mac = req.params.mac;
    if (!mac) {
      return res.status(400).json({ erro: "MAC não fornecido" });
    }

    const fk = req.headers["fk_empresa"];
    // opcional: validar fk se desejar restringir a consulta por empresa

    const dados = await caixaModel.buscarPorMac(mac);

    if (!dados || dados.length === 0) {
      return res.status(404).json({ erro: "Máquina não encontrada para esse MAC" });
    }

    // retornar latitude e longitude (único registro esperado)
    const registro = dados[0];
    return res.status(200).json({ latitude: registro.Latitude, longitude: registro.Longitude, caixa: registro });

  } catch (e) {
    console.error("X [CAIXAS] buscarPorMac erro:", e.code, e.sqlMessage || e.message);
    return res.status(500).json({ erro: "Falha ao consultar caixa por MAC" });
  }
}

module.exports = { listar, cadastrar, buscarPorMac };
