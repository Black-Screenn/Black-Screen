var database = require("../database/config")

function autenticar(email, senha) {
  const instrucaoSql = `
    select Id_Usuario, Nome, Email, Senha, Usuario.Fk_Empresa, Nome_Cargo
    from Usuario
    join Cargo on Id_Cargo = Fk_Cargo
    where Email = ? and Senha = ?
    limit 1
  `;
  return database.executar(instrucaoSql, [email, senha]);
}
function cadastrar(nome, email, senha, cargo, empresa) {

    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():", nome, email, senha); //, fkEmpresa

    const sql = `
    insert into Usuario (Nome, Email, Senha, Fk_Cargo, Fk_Empresa)
    values (?, ?, ?, ?, ?)
  `;
    console.log("Executando a instrução SQL: \n" + sql);
  return database.executar(sql, [nome, email, senha, cargo, empresa]);
}

function validarSenha(idUsuario, senhaAtual) {
  const sql = `
    select Id_Usuario
    from Usuario
    where Id_Usuario = ? and Senha = ?
    limit 1
  `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(sql, [idUsuario, senhaAtual]);
}

function trocar(idUsuario, novaSenha) {
  const sql = `
    update Usuario
    set Senha = ?
    where Id_Usuario = ?
  `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(sql, [novaSenha, idUsuario]);
}

function excluir(idUsuario) {
    const sql = `delete from Usuario where Id_Usuario = ?`;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(sql, [idUsuario]);
}

function listar(empresa) {
    var instrucaoSql = `SELECT u.Id_Usuario, u.Nome, u.Email, c.Nome_Cargo, e.Nome_Empresa FROM Usuario u JOIN Cargo c ON u.Fk_Cargo = c.Id_Cargo JOIN Empresa e ON u.Fk_Empresa = e.Id_Empresa WHERE u.Fk_Empresa = ${empresa} ORDER BY u.Id_Usuario;`;

    return database.executar(instrucaoSql);
}

module.exports = {
  autenticar,
  cadastrar,
  validarSenha,
  trocar,
  excluir,
  listar
};
