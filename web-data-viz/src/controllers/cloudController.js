
const s3 = require("@aws-sdk/client-s3");
const { stringify } = require('csv-stringify/sync');

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
  }
});

async function send(req, res) {

  try {
    const filename = req.params.filename;
    const dataframe = req.body.dataframe;
    
    if (!dataframe || !Array.isArray(dataframe)) {
      return res.status(400).json({ erro: "Dados do dataframe não fornecidos ou em formato inválido" });
    }

    const bucketName = process.env.BUCKET_NAME;

    dataframe[0] = JSON.parse(dataframe[0]);

    console.log(dataframe[0]);
    
    const csvContent = stringify(dataframe[0], {
      header: true,
      delimiter: ';'
    });

    const uploadCommand = new s3.PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      Body: csvContent,
      ContentType: 'text/csv'
    });

    await client.send(uploadCommand);
    
    return res.status(200).json({ 
      message: "Arquivo CSV enviado com sucesso",
      bucketName: bucketName,
      fileName: filename
    });

  } catch (e) {
    console.error("X [CLOUD] erro:", e.code, e.sqlMessage || e.message);
    return res.status(500).json({ erro: "Falha ao enviar arquivo" });
  }
}

async function uploadRelatorioS3(pdfBuffer, nomeArquivo, fkEmpresa) {
    const bucketName = process.env.AWS_BUCKET_CURATED_NAME;
    
    // Define o caminho dentro do bucket (ex: relatorios/2025/arquivo.pdf)
    const key = `relatorios/${fkEmpresa}/${nomeArquivo}`;

    const command = PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: pdfBuffer,
        ContentType: 'application/pdf'
    });

    try {
        await client.send(command);
        
        const url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        return url;
    } catch (error) {
        console.error("Erro ao enviar para o S3:", error);
        throw error;
    }
}

module.exports = { send, uploadRelatorioS3 };
