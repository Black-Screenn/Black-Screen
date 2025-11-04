var database = require("../database/config")

function cadastrar(empresa, nomeCargo) {
    var instrucaoSql = `INSERT INTO Cargo (Nome_Cargo, Fk_Empresa) VALUES ('${nomeCargo}', ${empresa});`;
    return database.executar(instrucaoSql);
}

function listar(empresa) {
    var instrucaoSql = `SELECT * FROM Cargo WHERE Fk_Empresa = ${empresa};`;

    return database.executar(instrucaoSql);
}
function modificar(idUsuario, cargo, email, nome) {
       var instrucaoSql = `
        UPDATE Usuario 
        SET 
            Nome = '${nome}', 
            Email = '${email}', 
            Fk_Cargo = ${cargo}
        WHERE 
            Id_Usuario = ${idUsuario};
    `;
    
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}
module.exports = {
  cadastrar,
  listar,
  modificar
};
