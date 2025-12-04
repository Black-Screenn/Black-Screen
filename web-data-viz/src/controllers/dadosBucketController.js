const {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const caixaModel = require("../models/caixaModel");

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });

async function buscarDadosDashboard(req, res) {
  // Estrutura esperada: bucket-client-etl > dashRafa > empresa=1 > ano=2025 > mes=12 > tipo=maquina > MAC.json

  const bucketName = "black-screen-client-1763819809"; // Ajuste conforme seu bucket real
  const prefixBase = "dashRafa/empresa=1/";

  try {
    console.log();
    console.log(`[S3] Buscando arquivos em ${bucketName}/${prefixBase}...`);

    // 1. Buscar todas as cabuscarDadosDashboardixas do banco para mapear MAC -> UF
    const caixas = await caixaModel.listarTodos();
    const mapaCaixas = {};
    caixas.forEach((c) => {
      if (c.Macaddress) {
        mapaCaixas[c.Macaddress.toLowerCase()] = {
          uf: c.UF,
          cidade: c.Cidade,
          bairro: c.Bairro,
          id: c.id,
          codigo: c.codigoCaixa,
        };
      }
    });

    // 2. Listar arquivos no S3
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefixBase,
    });

    const listResponse = await s3Client.send(listCommand);

    // Filtrar apenas JSONs de máquinas
    const jsonFiles =
      listResponse.Contents?.filter(
        (f) => f.Key.endsWith(".json") && f.Key.includes("tipo=maquina"),
      ) || [];

    if (jsonFiles.length === 0) {
      console.log("[S3] Nenhum arquivo JSON encontrado.");
      return res.json([]);
    }

    console.log(
      `[S3] Encontrados ${jsonFiles.length} arquivos JSON. Processando...`,
    );

    const resultados = [];

    for (const file of jsonFiles) {
      try {
        // Extrair MAC do nome do arquivo (ex: .../02bbbdc02bf9.json)
        const parts = file.Key.split("/");
        const fileName = parts[parts.length - 1];
        const mac = fileName.replace(".json", "").toLowerCase();

        // Ler conteúdo
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: file.Key,
        });
        const getResponse = await s3Client.send(getCommand);
        const bodyContents = await streamToString(getResponse.Body);
        const jsonContent = JSON.parse(bodyContents);

        // DEBUG: Logar a estrutura do primeiro arquivo lido para entender os campos
        if (resultados.length === 0) {
          console.log("--- DEBUG ESTRUTURA JSON S3 ---");
          console.log(JSON.stringify(jsonContent, null, 2));
          console.log("-------------------------------");
        }

        // Cruzar com dados do banco
        const infoBanco = mapaCaixas[mac] || {
          uf: "N/A",
          cidade: "Desconhecido",
        };

        // Extrair data da Key se possível (ano=2025/mes=12...)
        let dataArquivo = null;
        const anoMatch = file.Key.match(/ano=(\d{4})/);
        const mesMatch = file.Key.match(/mes=(\d{2})/);
        const diaMatch = file.Key.match(/dia=(\d{2})/);

        if (anoMatch && mesMatch) {
          const dia = diaMatch ? diaMatch[1] : "01";
          dataArquivo = `${anoMatch[1]}-${mesMatch[1]}-${dia}`;
        }

        resultados.push({
          macaddress: mac,
          ...infoBanco,
          data_arquivo: dataArquivo,
          dados: jsonContent,
        });
      } catch (erroArquivo) {
        console.error(
          `[S3] Erro ao processar arquivo ${file.Key}:`,
          erroArquivo,
        );
      }
    }

    res.json(resultados);
  } catch (error) {
    console.error("[S3] Erro Geral:", error);
    res.status(500).json({
      error: "Erro interno ao buscar dados do bucket",
      details: error.message,
    });
  }
}

module.exports = {
  buscarDadosDashboard,
};
