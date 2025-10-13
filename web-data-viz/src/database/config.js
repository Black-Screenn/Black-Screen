const mysql = require("mysql2");
require("dotenv").config({ path: ".env.dev" }); 

const mySqlConfig = {
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 3306)
};

function executar(instrucao, params = []) {
  if (
    process.env.AMBIENTE_PROCESSO !== "producao" &&
    process.env.AMBIENTE_PROCESSO !== "desenvolvimento"
  ) {
    console.log(
      "\nO AMBIENTE (produção OU desenvolvimento) NÃO FOI DEFINIDO EM .env OU .env.dev OU app.js\n"
    );
    return Promise.reject("AMBIENTE NÃO CONFIGURADO EM .env");
  }

  return new Promise((resolve, reject) => {
    const conexao = mysql.createConnection(mySqlConfig);

    conexao.connect((err) => {
      if (err) {
        console.error("X [DB] erro ao conectar:", err.code, err.message);
        return reject(err);
      }
      console.log(`[DB] host=${mySqlConfig.host} db=${mySqlConfig.database}`);
      console.log("[DB] SQL =>\n" + instrucao);
    });

    conexao.query(instrucao, params, (erro, resultados) => {
      conexao.end();

      if (erro) {
        console.error("[DB] SQL falhou =>\n" + instrucao);
        console.error("X [DB] erro:", erro.code, erro.sqlMessage || erro.message);
        return reject(erro);
      }

      resolve(resultados);
    });

    conexao.on("error", (erro) => {
      console.error("X [DB] connection error:", erro.code, erro.message);
    });
  });
}

module.exports = { executar };
