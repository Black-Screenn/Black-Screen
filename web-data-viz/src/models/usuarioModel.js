var database = require("../database/config")

function autenticar(email, senha) {
  const instrucaoSql = `
    select idUsuario, nome, email, senha, fkEmpresa
    from usuario
    where email = ? and senha = ?
    limit 1
  `;
  return database.executar(instrucaoSql, [email, senha]);
}
function cadastrar(nome, email, senha) {

    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():", nome, email, senha); //, fkEmpresa

    const sql = `
    insert into usuario (nome, email, senha)
    values (?, ?, ?)
  `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return db.executar(sql, [nome, email, senha]);
}

function validarSenha(idUsuario, senhaAtual) {
  const sql = `
    select idUsuario
    from usuario
    where idUsuario = ? and senha = ?
    limit 1
  `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return db.executar(sql, [idUsuario, senhaAtual]);
}

function trocar(idUsuario, novaSenha) {
  const sql = `
    update usuario
    set senha = ?
    where idUsuario = ?
  `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return db.executar(sql, [novaSenha, idUsuario]);
}

function excluir(idUsuario) {
    const sql = `delete from usuario where idUsuario = ?`;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return db.executar(sql, [idUsuario]);
}

module.exports = {
  autenticar,
  cadastrar,
  validarSenha,
  trocar,
  excluir
};
