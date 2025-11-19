var database = require("../database/config")

function cadastrar(link, empresa, texto) {
    var instrucaoSql = `INSERT INTO Relatorio (Link_Relatorio, Fk_Empresa, Conteudo_Texto) VALUES ('${link}', ${empresa}, '${texto}');`;
    return database.executar(instrucaoSql);
}

function listar(empresa) {
    var instrucaoSql = `SELECT * FROM Relatorio WHERE Fk_Empresa = ${empresa};`;

    return database.executar(instrucaoSql);
}

module.exports = {
  cadastrar,
  listar
};
