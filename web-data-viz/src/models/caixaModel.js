const db = require("../database/config");

const SQL_BASE = `
  select
    c.Id_Caixa       as id,
    c.codigoCaixa,
    c.Fk_Empresa,
    e.Logradouro, e.Bairro, e.Cidade, e.UF,
    e.Latitude, e.Longitude,
    emp.Nome_Empresa        as eNome,
    emp.Id_Empresa
  from Caixa c
  join Enderecos e on e.Fk_Endereco_Maquina = c.Id_Caixa
  join Empresa emp  on emp.Id_Empresa = c.Fk_Empresa
  where e.Latitude is not null and e.Longitude is not null
`;

function listarTodos() {
  const sql = SQL_BASE + " order by c.Id_Caixa";
  return db.executar(sql);
}

function listarPorEmpresa(fkEmpresa) {
  const fk = Number(fkEmpresa);
  if (!Number.isInteger(fk)) {
    return Promise.reject(new Error("fkEmpresa inválida"));
  }
  const sql = SQL_BASE + ` and c.Fk_Empresa = ${fk} order by c.Id_Caixa`;
  return db.executar(sql);
}

async function cadastrar(caixa){
  let sql = `
    SELECT COUNT(Id_Caixa) AS Id_Caixa FROM Caixa WHERE Fk_Empresa = ${caixa.idEmpresa};
  `

  res = await db.executar(sql);

  sql = `
    INSERT INTO Enderecos(Cep, Logradouro, Bairro, Cidade, UF, Pais, Latitude, Longitude )
      VALUES("${caixa.cep}", "${caixa.logradouro}", "${caixa.bairro}", "${caixa.cidade}", "${caixa.uf}", "${caixa.pais}", ${caixa.latitude}, ${caixa.longitude})
  `;
  
  await db.executar(sql);

  sql = `
    SELECT MAX(Id_Endereco) AS idEndereco FROM Enderecos;
  `
  const enderecoResult = await db.executar(sql);
  const idEndereco = enderecoResult[0].idEndereco;

  sql = `
    SELECT MAX(Id_Caixa) AS idCaixa FROM Caixa WHERE Fk_Empresa = ${caixa.idEmpresa};
  `
  return db.executar(sql).then(result => {
    const idCaixa = result[0].idCaixa;
    console.log(result)
    sql = `
      INSERT INTO Caixa(codigoCaixa, Fk_Empresa, Fk_Endereco_Maquina)
        VALUES("CX-${idCaixa+1}_${caixa.idEmpresa}", ${caixa.idEmpresa}, ${idEndereco});
    `
    return db.executar(sql).then(() => idCaixa);
  });
}

module.exports = { listarTodos, listarPorEmpresa, cadastrar };
