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

async function cadastrar(caixa){
  let sql = `
    SELECT COUNT(idCaixa) AS idCaixa FROM caixas WHERE fkEmpresa = ${caixa.idEmpresa};
  `

  res = await db.executar(sql);

  sql = `
    INSERT INTO caixas(codigoCaixa, fkEmpresa)
      VALUES("CX-${res[0].idCaixa+1}_${caixa.idEmpresa}", ${caixa.idEmpresa});
  `
  await db.executar(sql);

  sql = `
    SELECT MAX(idCaixa) AS idCaixa FROM caixas WHERE fkEmpresa = ${caixa.idEmpresa};
  `
  return db.executar(sql).then(result => {
    const idCaixa = result[0].idCaixa;
    console.log(result)
    sql = `
      INSERT INTO endereco(cep, logradouro, bairro, cidade, uf, pais, latitude, longitude, fkCaixa)
        VALUES("${caixa.cep}", "${caixa.logradouro}", "${caixa.bairro}", "${caixa.cidade}", "${caixa.uf}", "${caixa.pais}", ${caixa.latitude}, ${caixa.longitude},${idCaixa})
    `;
    return db.executar(sql).then(() => idCaixa);
  });
}

module.exports = { listarTodos, listarPorEmpresa, cadastrar };
