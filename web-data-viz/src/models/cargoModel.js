var database = require("../database/config")

function cadastrar(empresa, nomeCargo) {
    var instrucaoSql = `INSERT INTO Cargo (Nome_Cargo, Fk_Empresa) VALUES ('${nomeCargo}', ${empresa});`;
    return database.executar(instrucaoSql);
}

function listar(empresa) {
    var instrucaoSql = `SELECT * FROM Cargo WHERE Fk_Empresa = ${empresa};`;

    return database.executar(instrucaoSql);
}

module.exports = {
  cadastrar,
  listar
};
