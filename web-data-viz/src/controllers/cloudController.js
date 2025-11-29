const s3 = require("@aws-sdk/client-s3");
const { stringify } = require('csv-stringify/sync');
const { parse } = require('csv-parse/sync');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { buscarPorId } = require("../models/relatorioModel.js")

const REGION_AWS = process.env.REGION_AWS;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_SESSION_TOKEN = process.env.AWS_SESSION_TOKEN;

const client = new s3.S3Client({
  region: REGION_AWS,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    sessionToken: AWS_SESSION_TOKEN
  },
  forcePathStyle: true
});

async function send(req, res) {

  try {
    const FILENAME = req.params.filename;
    const dataframe = req.body.dataframe;

    if (!dataframe || !Array.isArray(dataframe)) {
      return res.status(400).json({ erro: "Dados do dataframe não fornecidos ou em formato inválido" });
    }

    const BUCKET_NAME = process.env.BUCKET_NAME;

    dataframe[0] = JSON.parse(dataframe[0]);

    console.log(dataframe[0]);

    const csvContent = stringify(dataframe[0], {
      header: true,
      delimiter: ';'
    });

    const uploadCommand = new s3.PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: FILENAME,
      Body: csvContent,
      ContentType: 'text/csv'
    });

    await client.send(uploadCommand);

    return res.status(200).json({
      message: "Arquivo CSV enviado com sucesso",
      bucketName: BUCKET_NAME,
      fileName: FILENAME
    });

  } catch (e) {
    console.error("X [CLOUD] erro:", e.code, e.sqlMessage || e.message);
    return res.status(500).json({ erro: "Falha ao enviar arquivo" });
  }
}

async function uploadRelatorioS3(pdfBuffer, nomeArquivo, fkEmpresa) {
  const BUCKET_NAME = process.env.AWS_BUCKET_CURATED_NAME;

  const key = `relatorios/${fkEmpresa}/${nomeArquivo}`;

  const command = new s3.PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: pdfBuffer,
    ContentType: 'application/pdf'
  });

  try {
    await client.send(command);
    console.log("SUCESSO ENVIAR")
    const url = `https://${BUCKET_NAME}.s3.${process.env.REGION_AWS}.amazonaws.com/${key}`;
    return url;
  } catch (error) {
    console.error("Erro ao enviar para o S3:", error);
    throw error;
  }
}

async function acessarRelatorio(req, res) {
  try {
    const idRelatorio = req.params.id;

    const resultadoRelatorio = await buscarPorId(idRelatorio);

    const relatorio = resultadoRelatorio && resultadoRelatorio.length > 0 ? resultadoRelatorio[0] : null;

    if (!relatorio) {
      return res.status(404).json({ erro: "Relatório não encontrado" });
    }

    const link = relatorio.Link_Relatorio;

    console.log("--- DEBUG AWS S3 ---");
    console.log("1. Link recebido:", link);
    console.log("2. Bucket no ENV:", process.env.AWS_BUCKET_CURATED_NAME);
    console.log("3. Region no ENV:", process.env.REGION_AWS);

    const partes = link.split('.com/');
    const keyDoArquivo = decodeURIComponent(partes[1].startsWith('/') ? partes[1].substring(1) : partes[1]);

    console.log("4. Key Extraída:", keyDoArquivo);

    const command = new s3.GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_CURATED_NAME,
      Key: keyDoArquivo
    });

    console.log("[LENDO RELATÓRIO] Gerando link temporário...");
    const urlAssinada = await getSignedUrl(client, command, { expiresIn: 900 });

    res.json({ url: urlAssinada });

  } catch (error) {
    console.error("Erro ao gerar link:", error);
    res.status(500).json({ error: "Erro ao buscar relatório" });
  }
}

function datasRange(periodoInicio, periodoFim) {
  const datas = [];
  let dataInicio = new Date(periodoInicio + 'T00:00:00');
  const dataFim = new Date(periodoFim + 'T00:00:00');

  console.log("Datas: "+dataInicio+ " | " +dataFim)

  while (dataInicio <= dataFim) {
    const dataFormatada = dataInicio.toISOString().split('T')[0];
    console.log("Data Formatada: "+dataFormatada)
    datas.push(dataFormatada);
    dataInicio.setDate(dataInicio.getDate() + 1);
  }
  return datas;
}

async function dadosS3PorPeriodo(fkEmpresa, periodoInicio, periodoFim) {
  const datas = datasRange(periodoInicio, periodoFim);
  let dadosCombinados = [];
  const BUCKET_NAME = process.env.AWS_BUCKET_CURATED_NAME;

  for (const dataString of datas) {
    const [ano, mes, dia] = dataString.split('-');

    const s3Prefix = `empresa=${fkEmpresa}/ano=${ano}/mes=${mes}/dia=${dia}/tipo=maquina/`;
    console.log(`Buscando dados para o prefixo: ${s3Prefix}`);

    const fileKey = `${s3Prefix}dados.csv`;

    try {
      const getCommand = new s3.GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey
      });

      const response = await client.send(getCommand);

      const streamToString = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", (chunk) => chunks.push(chunk));
          stream.on("error", reject);
          stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        });

      const csvString = await streamToString(response.Body);

      const records = parse(csvString, {
        columns: true,
        skip_empty_lines: true,
        delimiter: ';'
      });

      dadosCombinados.push(...records);
      console.log(`- ${fileKey} processado com ${records.length} registros.`);

    } catch (error) {
      if (error.Code === 'NoSuchKey') {
        console.log(`- Nenhum arquivo encontrado para ${dateString}, pulando.`);
      } else {
        console.error(`Erro ao buscar ${fileKey}:`, error);
      }
    }
  }

  console.log(`Busca S3 concluída. Total de registros combinados: ${dadosCombinados.length}`);
  return dadosCombinados;
}

module.exports = { send, uploadRelatorioS3, acessarRelatorio, dadosS3PorPeriodo };
