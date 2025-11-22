const { S3Client, ListObjectsV2Command, GetObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
    }
});
const streamToString = (stream) =>
    new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    });

async function buscarProcessos(req, res) {
    const bucketName = "client-blackscreen"; 
    const prefix = "processado_Processos/";

    try {
        console.log("Iniciando busca de arquivos no S3...");

        const listCommand = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: prefix
        });
        
        const listResponse = await s3Client.send(listCommand);

        const csvFiles = listResponse.Contents?.filter(f => f.Key.endsWith('.csv')) || [];

        if (csvFiles.length === 0) {
            return res.json([]); 
        }

        const downloadPromises = csvFiles.map(async (file) => {
            const getCommand = new GetObjectCommand({ Bucket: bucketName, Key: file.Key });
            const response = await s3Client.send(getCommand);
            
            const conteudoTexto = await streamToString(response.Body);

            return {
                nomeArquivo: file.Key,
                csvConteudo: conteudoTexto
            };
        });

        const resultados = await Promise.all(downloadPromises);
        
        res.json(resultados);

    } catch (error) {
        console.error("Erro ao buscar no S3:", error);
        res.status(500).json({ error: "Erro interno ao buscar dados", details: error.message });
    }
}

module.exports = {
    buscarProcessos
};