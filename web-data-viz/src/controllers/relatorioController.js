const { GoogleGenAI } = require('@google/genai');
const fs = require('fs').promises;
const MarkdownIt = require('markdown-it');
const puppeteer = require('puppeteer');
const crypto = require('crypto');

const { uploadRelatorioS3, dadosS3PorPeriodo } = require('./cloudController.js');
const { buscarParametroPorComponente } = require('../models/componenteModel.js')
const { cadastrar, listar } = require('../models/relatorioModel.js');

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelo = "gemini-2.0-flash-lite";
const md = new MarkdownIt();

function converterParaCSV(dataArray) {
    if (!dataArray || dataArray.length === 0) return "";

    const headers = Object.keys(dataArray[0]).join(',');
    const rows = dataArray.map(obj => Object.values(obj).join(','));
    return [headers, ...rows].join('\n');
}

async function uploadArquivoParaGemini(buffer, fileName, mimeType) {
    const tempFilePath = `/tmp/${fileName}`;
    await fs.writeFile(tempFilePath, buffer);

    const uploadedFile = await genAI.files.upload({
        file: tempFilePath,
        mimeType: mimeType,
        displayName: fileName,
    });

    console.log(`Arquivo ${uploadedFile.displayName} (${uploadedFile.name}) carregado com sucesso.`);
    await fs.unlink(tempFilePath);

    return uploadedFile;
}


async function agenteAnalise(dadosJSON, uploadedFile) {
    console.log("[GERAR RELATORIO] [1/4] Iniciando Módulo de Análise");

    const instrucaoSistemaAnalise = `
        **AVISO: SUA ÚNICA TAREFA É REFORMATAR DADOS. VOCÊ É UM ESCRITURÁRIO DE DADOS.**

        Você recebe dados de monitoramento de ATMs (CSV/JSON) e deve produzir um RELATÓRIO EM MARKDOWN puramente factual, em formato RESUMIDO.

        Outros agentes farão análise e recomendações. Você será penalizado por adicionar qualquer opinião ou julgamento.

        --------------------
        REGRAS DE PROIBIÇÃO (MUITO IMPORTANTE)
        --------------------
        1. **NÃO USE** as palavras: "Sumário Executivo", "Conclusões", "Recomendações", "Resumo", "Próximos Passos".
        2. **NÃO USE** palavras de julgamento: "Crítico", "Alerta", "Saudável", "Problema", "Risco", "Exigindo atenção", "Intervenção imediata" ou similares.
        3. **NÃO ANALISE** e não escreva "Observações". Apenas descreva fatos objetivos (contagens, médias, máximos, mínimos, existência de alertas).
        4. **NÃO RETORNE** JSON, código, ou blocos de código.
        5. **NÃO REPLIQUE O CSV** nem crie tabelas com todos os registros. Você deve **RESUMIR**.
        6. **NÃO COLOQUE TABELAS DETALHADAS** com todas as linhas. No máximo, liste IDs e contagens em listas com bullets.
        7. NÃO FAÇA TEXTO ENORME.
        8. SUA SAÍDA É APENAS TEXTO EM MARKDOWN.

        --------------------
        REGRAS ESPECÍFICAS PARA ALERTAS
        --------------------
        - Você receberá dados com métricas como CPU, RAM, DISCO, PACOTES_PERDIDOS, etc.
        - Considere que os limites de alerta já vêm indicados nos dados ou nos parâmetros do usuário. NÃO invente limites.
        - Para cada métrica (CPU, RAM, DISCO, PACOTES_PERDIDOS, etc.), você deve:
        - Contar quantos alertas dessa métrica ocorreram no período analisado (somatória de erros por componente).
        - Informar essa contagem em texto, por exemplo:
            - "Total de alertas em **CPU**: 37"
            - "Total de alertas em **RAM**: 12"
            - "Total de alertas em **PACOTES_PERDIDOS**: 8"
        - Para cada ATM com alertas, você deve identificar:
        - O dia (data) em que houve MAIOR quantidade de alertas para aquele ATM.
        - A quantidade de alertas nessa data.
        - Exemplo de formato:
            - "Para o ATM \`[ID_ATM]\`, o dia com maior número de alertas foi [YYYY-MM-DD], com N alertas registrados."
        - NÃO liste alerta por alerta, nem repita o mesmo tipo de alerta linha a linha.
        - Priorize SEMPRE:
        - Somatórios por componente (CPU, RAM, etc.).
        - O dia com mais alertas por ATM.

        --------------------
        FORMATO DE SAÍDA (OBRIGATÓRIO)
        --------------------

        1. O RELATÓRIO DEVE COMEÇAR COM:
        ## Relatório de Monitoramento

        2. Em seguida, crie a seção:
        ## Sumário Factual

        Nesta seção, liste APENAS contagens gerais (em bullets), por exemplo:
        - Total de ATMs monitorados (amostra): X
        - Total de ATMs com alertas: Y
        - Total de ATMs sem alertas: Z

        3. Depois crie a seção:
        ## Detalhamento de ATMs APENAS COM ALERTAS

        Para CADA ATM COM ALERTA:
        - Crie um subtítulo: \`### ID: [ID_ATM]\`
        - Liste as métricas que violaram o limite, usando **negrito**, por exemplo:
            - Métricas com violações: **CPU**, **RAM**
        - Liste os alertas brutos da ETL, caso existam campos de alerta (copie os textos dos alertas, sem interpretar).

        4. Em seguida, crie a seção:
        ## ATMs Sem Alertas

        - **NÃO LISTE MÉTRICAS INDIVIDUAIS** nesta seção.
        - Se houver **10 ou menos** ATMs sem alertas, liste apenas os IDs em bullets, por exemplo:
            - ID: 02bbbdc02bf9
        - Se houver **mais de 10** ATMs sem alertas, não liste IDs; apenas informe a contagem, por exemplo:
            - 1022 ATMs operando normalmente (sem alertas)

        5. NÃO CRIE NENHUMA OUTRA SEÇÃO além de:
        - "## Relatório de Monitoramento"
        - "## Sumário Factual"
        - "## Detalhamento de ATMs APENAS COM ALERTAS"
        - "## ATMs Sem Alertas"

        6. NÃO USE TABELAS MARKDOWN (| colunas |). Use apenas texto e listas com "- ".

        --------------------
        EXEMPLO DE FORMATO (APENAS FORMATO, NÃO COPIE OS VALORES)
        --------------------

        ## Relatório de Monitoramento

        ## Sumário Factual
        - Total de ATMs monitorados (amostra): 4
        - Total de ATMs com alertas: 2
        - Total de ATMs sem alertas: 2

        ---

        ## Detalhamento de ATMs APENAS COM ALERTAS

        ### ID: ATM-001
        - Métricas com violações: **CPU**, **RAM**
        - Alertas ETL:
            - "CPU acima do limite configurado"
            - "RAM acima do limite configurado"

        ### ID: ATM-002
        - Métricas com violações: **DISCO**
        - Alertas ETL:
            - "Uso de disco acima do limite configurado"

        ---
    `;

    const promptUsuario = `
        Você é o primeiro módulo do meu relatório.

        Sua tarefa é:
        - Ler os dados de monitoramento de ATMs (fornecidos em CSV ou JSON).
        - Identificar quantos ATMs existem, quantos têm alertas e quantos não têm alertas.
        - Para cada ATM com alerta, listar apenas:
        - ID do ATM.
        - Métricas que violaram o limite (em **negrito**).
        - Textos dos alertas brutos da ETL.

        Não faça análise, não recomende nada. Apenas siga o FORMATO DE SAÍDA definido na instrução do sistema, começando obrigatoriamente com:

        ## Relatório de Monitoramento

        Abaixo estão os dados em JSON para você usar como base factual:

        ${JSON.stringify(dadosJSON, null, 2)}
    `;

    try {
        const result = await genAI.models.generateContent({
            model: modelo,
            systemInstruction: instrucaoSistemaAnalise,
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: promptUsuario },
                        { fileData: { mimeType: uploadedFile.mimeType, fileUri: uploadedFile.uri } }
                    ]
                }
            ]

        });
        console.log("[GERAR RELATORIO] Agente de Análise concluiu.");
        return result.text;
    } catch (error) {
        console.error("[GERAR RELATORIO - ERRO] Erro no Agente de Análise:", error);
        throw new Error("Falha ao gerar análise.");
    }
}

async function agenteRecomendacoes(textoAnaliseFactual) {
    console.log("[GERAR RELATORIO] [2/4] Iniciando Módulo de Insights");

    const instrucaoSistemaRecomendacoes = `
        Persona (Quem você é): Você é o 'BlackAnalyst', um especialista sênior em manutenção de hardware de ATMs.
        
        Contexto (Onde você está): Você é o segundo agente em uma cadeia. Você receberá um relatório factual (em Markdown) que lista ATMs com alertas.

        Tarefa Principal: Sua única tarefa é LER o relatório factual e ANEXAR uma nova seção no final chamada "## Recomendações e Ações Prioritárias".

        Formato de Saída (Obrigatório):
        * Para cada ATM listado em "ATMs com Alertas" no texto de entrada, crie uma subseção "### Ações para o ATM [ID]".
        * Dentro de cada subseção, forneça:
            * "* **Prioridade:** (Alta, Média, Baixa)"
            * "* **Diagnóstico Provável:** (Seja conciso. Ex: "Múltiplos alertas sugerem processo em loop", "Falta de espaço em disco iminente.")"
            * "* **Ação Recomendada:** (Seja direto. Ex: "Equipe de campo deve investigar logs de processo.", "Executar script de limpeza de disco 'clean_logs.sh' remotamente.")"

        Restrições (O que NÃO fazer):
        * NÃO repita a análise (NÃO liste as métricas novamente).
        * NÃO escreva um sumário ou introdução (o Agente 3 fará isso).
        * Apenas retorne a nova seção "## Recomendações e Ações Prioritárias".
    `;

    const promptUsuario = `
        Com base no relatório factual abaixo, gere a seção "## Recomendações e Ações Prioritárias".

        --- RELATÓRIO FATUAL ---
        ${textoAnaliseFactual}
        --- FIM DO RELATÓRIO ---
    `;

    try {
        const result = await genAI.models.generateContent({
            model: modelo,
            systemInstruction: instrucaoSistemaRecomendacoes,
            contents: promptUsuario
        });
        console.log("[GERAR RELATORIO] Agente de Recomendações concluiu.");
        return result.text;
    } catch (error) {
        console.error("[GERAR RELATORIO - ERRO] Erro no Agente de Recomendações:", error);
        throw new Error("Falha ao gerar recomendações.");
    }
}

async function agenteSumarizacao(relatorioCompleto) {
    console.log("[GERAR RELATORIO] [3/4] Iniciando Módulo de Sumarização (Final)...");

    const instrucaoSistemaSumarizacao = `
        Persona (Quem você é): Você é o 'BlackAnalyst', o Analista Chefe (SME - Subject Matter Expert).
        
        Contexto (Onde você está): Você é o ÚLTIMO agente da cadeia. Sua tarefa é ler o relatório técnico completo (que já contém a análise factual e as recomendações) e escrever o **"Sumário Executivo"**.

        Tarefa Principal: Gerar um parágrafo curto (máximo 4-5 frases) que será colocado NO TOPO do relatório. O analista deve ler apenas isso e entender 90% do problema.

        O Sumário Executivo DEVE responder:
        1.  Qual foi o escopo? (Ex: "Análise de 1024 ATMs...")
        2.  Qual a descoberta principal? (Ex: "...identificou X ATMs com alertas críticos...")
        3.  Qual é a recomendação mais urgente? (Ex: "...exigindo ação imediata no ATM '00:00:...' devido a falhas de CPU/RAM.")
        
        Formato de Saída (Obrigatório):
        * Um único cabeçalho: "## Sumário Executivo"
        * Seguido de um parágrafo conciso.
        
        Restrições (O que NÃO fazer):
        * NÃO repita os detalhes técnicos.
        * NÃO mencione os ATMs saudáveis.
        * Seja direto, gerencial e focado na ação.
    `;

    const promptUsuario = `
        Leia o relatório técnico completo abaixo e gere APENAS o "## Sumário Executivo" gerencial.

        --- RELATÓRIO TÉCNICO COMPLETO ---
        ${relatorioCompleto}
        --- FIM DO RELATÓRIO ---
    `;

    try {
        const result = await genAI.models.generateContent({
            model: modelo,
            systemInstruction: instrucaoSistemaSumarizacao,
            contents: promptUsuario
        });
        console.log("[GERAR RELATORIO] Agente de Sumarização concluiu.");
        return result.text;
    } catch (error) {
        console.error("[GERAR RELATORIO - ERRO] Erro no Agente de Sumarização:", error);
        throw new Error("Falha ao gerar sumário.");
    }
}

async function gerarRelatorio(req, res) {
    try {
        const fkEmpresa = req.body.fkEmpresa;
        const periodoInicio = req.body.periodoInicio || '';
        const periodoFim = req.body.periodoFim || '';

        const dadosCompletosS3 = await dadosS3PorPeriodo(fkEmpresa, periodoInicio, periodoFim);

        const componentesParametro = await buscarParametroPorComponente();

        const csvString = converterParaCSV(dadosCompletosS3);
        const csvBuffer = Buffer.from(csvString, 'utf-8');

        const arquivoGemini = await uploadArquivoParaGemini(csvBuffer, 'relatorio_dados.csv', 'text/csv');

        if (req.url === '/favicon.ico') {
            return res.status(204).end();
        }

        let dadosDoRequest = {
            "periodo_analise": `${periodoInicio} a ${periodoFim}`,
            "limites_saudaveis": componentesParametro
        };

        const textoAnalise = await agenteAnalise(dadosDoRequest, arquivoGemini);

        await genAI.files.delete({ name: arquivoGemini.name });

        console.log(textoAnalise)

        const textoRecomendacoes = await agenteRecomendacoes(textoAnalise);

        const relatorioParcial = textoAnalise + "\n\n" + textoRecomendacoes;

        const textoSumarizado = await agenteSumarizacao(relatorioParcial);

        const relatorioFinal = textoSumarizado + "\n\n" + relatorioParcial;

        const relatorioHTML = md.render(relatorioFinal);

        const logoUrl = "https://raw.githubusercontent.com/Black-Screenn/Black-Screen/refs/heads/main/web-data-viz/public/assets/imgs/blackscreenlogo.png";

        const htmlCompleto = `
            <html>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    body { 
                        font-family: 'Barlow', sans-serif; 
                        font-size: 14px;
                        color: #333;
                        line-height: 1.5;
                        margin: 0;
                    }

                    .header { 
                        text-align: center; 
                        padding-bottom: 15px; 
                        margin-bottom: 30px; 
                    }
                    .header img { 
                        max-width: 200px; 
                    }

                    
                    h1, h2, h3, h4 { 
                        color: #000; 
                        margin-top: 25px; 
                        page-break-after: avoid;
                        break-after: avoid;
                    }

                    li, pre, blockquote, .alert-box {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }

                    h2 { 
                        border-bottom: 1px solid #ccc; 
                        padding-bottom: 5px; 
                        font-weight: 700;
                        font-size: 18px;
                    }
                    
                    h3 {
                        font-size: 16px;
                        margin-bottom: 5px;
                    }

                    ul { 
                        margin-top: 5px;
                        padding-left: 20px;
                    }

                    li { 
                        margin-bottom: 4px; 
                    }

                    strong { 
                        color: #000;
                    }

                    pre { 
                        background-color: #f4f4f4; 
                        border: 1px solid #ddd;
                        font-family: monospace; 
                        padding: 10px;
                        border-radius: 4px;
                        white-space: pre-wrap;
                    }

                    .footer {
                        margin-top: 50px; 
                        font-size: 10px; 
                        text-align: center; 
                        color: #888;
                        border-top: 1px solid #eee;
                        padding-top: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="${logoUrl}" alt="Logo da Empresa">
                </div>
                
                ${relatorioHTML}

                <div style="margin-top: 50px; font-size: 12px; text-align: center; color: #888;">
                    Relatório gerado automaticamente por BlackAnalyst AI em ${new Date().toLocaleString()}
                </div>
            </body>
            </html>
        `;

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.setContent(htmlCompleto, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                bottom: '20mm',
                left: '15mm',
                right: '15mm'
            },
            footerTemplate: `
                <div style="font-size: 10px; width: 100%; text-align: right; padding-right: 20px;">
                    <span class="pageNumber"></span> / <span class="totalPages"></span>
                </div>
            `
        });

        console.log("[GERAR RELATÓRIO PDF] [4/4] Tamanho do PDF Gerado:", pdfBuffer.length, "bytes");

        await browser.close();
        console.log("[GERAR RELATÓRIO Sucesso] Enviando PDF");

        const dadosUnicos = Date.now().toString() + Math.random().toString();
        const hash = crypto.createHash('md5').update(dadosUnicos).digest('hex');

        link = await uploadRelatorioS3(pdfBuffer, "relatorio_" + hash, fkEmpresa);
        cadastrar(link, fkEmpresa, relatorioFinal, periodoInicio, periodoFim)

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=relatorio.pdf');
        res.end(pdfBuffer, 'binary');
    } catch (error) {
        console.error("Erro no fluxo 'gerarRelatorio':", error);
        res.status(500).json({ error: "Falha ao processar relatório." });
    }
}


async function listarRelatorios(req, res) {
    try {
        const empresa = req.body.fkEmpresa || req.query.fkEmpresa;

        if (!empresa) {
            return res.status(400).json({ erro: 'Fk_Empresa é obrigatório.' });
        }

        const resultados = await listar(empresa);

        const rows = Array.isArray(resultados) && resultados.length > 0 && Array.isArray(resultados[0]) ? resultados[0] : resultados;

        if (!rows || rows.length === 0) {
            return res.status(204).send();
        }

        return res.status(200).json(rows);
    } catch (error) {
        console.error('[RELATORIO] Erro ao listar relatórios:', error);
        return res.status(500).json({ erro: error.message || error });
    }
}

module.exports = { gerarRelatorio, listarRelatorios }