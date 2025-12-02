var database = require("../database/config")

function cadastrar(link, empresa, texto, periodoInicio, periodoFim) {
    var instrucaoSql = `INSERT INTO Relatorio (Link_Relatorio, Fk_Empresa, Conteudo_Texto, Periodo_Inicio, Periodo_Fim) VALUES ('${link}', ${empresa}, '${texto}', '${periodoInicio}', '${periodoFim}');`;
    return database.executar(instrucaoSql);
}

function listar(empresa) {
    var instrucaoSql = `SELECT * FROM Relatorio WHERE Fk_Empresa = ${empresa} ORDER BY Id_Relatorio DESC;`;

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

function avaliar(idRelatorio, avaliacao) {
    console.log(`[Relatorio Model] Avaliando Relatório por ID: ${idRelatorio}`);
    
    const instrucaoSql = `
        UPDATE Relatorio 
        SET Avaliacao = ${avaliacao}
        WHERE Id_Relatorio = ${idRelatorio};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
  cadastrar,
  listar,
  buscarPorId,
  avaliar
};
