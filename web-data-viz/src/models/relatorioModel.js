var database = require("../database/config")

function cadastrar(link, empresa, texto) {
    var instrucaoSql = `INSERT INTO Relatorio (Link_Relatorio, Fk_Empresa, Conteudo_Texto) VALUES ('${link}', ${empresa}, '${texto}');`;
    return database.executar(instrucaoSql);
}

function listar(empresa) {
    var instrucaoSql = `SELECT * FROM Relatorio WHERE Fk_Empresa = ${empresa};`;

    return database.executar(instrucaoSql);
}

function buscarPorId(idRelatorio) {
    console.log(`[Relatorio Model] Buscando relatório pelo ID: ${idRelatorio}`);
    
    const instrucaoSql = `
        SELECT * FROM Relatorio 
        WHERE Id_Relatorio = ${idRelatorio};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
  cadastrar,
  listar,
  buscarPorId
};
