/*const { S3Client, ListObjectsV2Command, GetObjectCommand } = require("@aws-sdk/client-s3");

let resultadoFinal = [];
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
    const prefix = "processado_Maquina/";

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

        console.log(`Encontrados ${csvFiles.length} arquivos. Processando conteúdo...`);



        for (const file of csvFiles) {
            try {
                const getCommand = new GetObjectCommand({ Bucket: bucketName, Key: file.Key });
                const getResponse = await s3Client.send(getCommand);
                const bodyContents = await streamToString(getResponse.Body);
                const linhas = bodyContents.split(/\r\n|\n|\r/);
                const headers = linhas[0].split(";").map(h => h.trim());

                for (let i = 1; i < linhas.length; i++) {
                    const linhaTexto = linhas[i].trim();
                    if (!linhaTexto) continue;


                    const colunas = linhaTexto.split(";");
                    const obj = {};

                    for (let j = 0; j < headers.length; j++) {
                        if (headers[j] !== undefined && colunas[j] !== undefined) {
                            obj[headers[j]] = colunas[j].trim();
                        }
                    }
                    if (Object.keys(obj).length > 0) {
                        resultadoFinal.push(obj);
                    }
                }
            } catch (erroArquivo) {
                console.error(`Erro arquivo ${file.Key}:`, erroArquivo);
            }
        }
    } catch (error) {
        console.error("Erro Geral S3:", error);
        res.status(500).json({ error: "Erro interno ao buscar dados", details: error.message });
    }



    res.json(resultadoFinal);

}

module.exports = {
    buscarProcessos
};*/