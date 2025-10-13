const db = require("../database/config");

const SQL_BASE = `
  select
    c.idCaixa       as id,
    c.codigoCaixa,
    c.fkEmpresa,
    e.logradouro, e.numero, e.bairro, e.cidade, e.uf,
    e.latitude, e.longitude,
    emp.nome        as eNome
  from caixas c
  join endereco e   on e.fkCaixa   = c.idCaixa
  join empresa emp  on emp.idEmpresa = c.fkEmpresa
  where e.latitude is not null and e.longitude is not null
`;

function listarTodos() {
  const sql = SQL_BASE + " order by c.idCaixa";
  return db.executar(sql);
}

function listarPorEmpresa(fkEmpresa) {
  const fk = Number(fkEmpresa);
  if (!Number.isInteger(fk)) {
    return Promise.reject(new Error("fkEmpresa inválida"));
  }
  const sql = SQL_BASE + ` and c.fkEmpresa = ${fk} order by c.idCaixa`;
  return db.executar(sql);
}

module.exports = { listarTodos, listarPorEmpresa };
