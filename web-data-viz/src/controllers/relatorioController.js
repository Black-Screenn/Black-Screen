const { GoogleGenAI } = require('@google/genai');
const fs = require('fs').promises;
const MarkdownIt = require('markdown-it');
const puppeteer = require('puppeteer');
const crypto = require('crypto');

const { uploadRelatorioS3, dadosS3PorPeriodo } = require('./cloudController.js');
const { buscarParametroPorComponente } = require('../models/componenteModel.js')
const { cadastrar, listar, avaliar } = require('../models/relatorioModel.js');

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelo = "gemini-2.0-flash-lite";
const md = new MarkdownIt({ html: true });

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

function limparTextoIA(texto) {
    if (!texto) return "";
    
    return texto
        .replace(/^```markdown\n?/i, '')
        .replace(/^```\n?/i, '')
        .replace(/```$/i, '')
        .trim();
}

async function agenteAnalise(dadosJSON, uploadedFile) {
    console.log("[GERAR RELATORIO] [1/4] Iniciando Módulo de Análise");

    const instrucaoSistemaAnalise = `
        **AVISO: SUA ÚNICA TAREFA É REFORMATAR DADOS. VOCÊ É UM ESCRITURÁRIO DE DADOS.**

        Você recebe dados de monitoramento de ATMs (CSV/JSON) e deve produzir um RELATÓRIO EM MARKDOWN puramente factual, em um MODELO CONSISTENTE.  
        Outros agentes farão análise e recomendações. Você será penalizado por adicionar qualquer opinião, julgamento ou interpretações além do pedido abaixo.

        IMPORTANTE: ESTE PROMPT É STRICT. SÓ É PERMITIDO CRIAR LISTAS/BULLETS NOS LOCAIS EXATAMENTE ESPECIFICADOS NO "FORMATO DE SAÍDA". QUALQUER OUTRA LISTA/ITEM EM FORMA DE BULLET É ERRO.

        --------------------
        REGRAS GERAIS (OBRIGATÓRIO)
        --------------------
        - SUA SAÍDA DEVE SER APENAS MARKDOWN. Use cabeçalhos e formatação Markdown básica (negrito, inline code).
        - NÃO retorne JSON, blocos de código, tabelas Markdown (| colunas |) ou quaisquer formatos além de Markdown textual.
        - NÃO inclua seções extras, explicações, desculpas, instruções, ou metadados.
        - Respeite exatamente os cabeçalhos e a ordem definidos neste documento.
        - Preserve consistência: sempre gere as mesmas seções, na mesma ordem, mesmo se alguma estiver vazia.
        - Datas: YYYY-MM-DD. Números: inteiros sem formatação.
        - PROIBIDO criar bullets/lists fora dos locais autorizados (ver "FORMATO DE SAÍDA" abaixo).

        --------------------
        REGRAS ESPECÍFICAS PARA ALERTAS (OBRIGATÓRIO)
        --------------------
        - Considere apenas os campos e flags fornecidos; NÃO invente limites ou interpretações.
        - Calcule SOMATÓRIAS DE ALERTAS POR COMPONENTE (total de ocorrências por métrica no período).
        - Ordem fixa: **CPU**, **RAM**, **DISCO**, **PACOTES_PERDIDOS**, seguido de outras métricas em ordem alfabética.
        - Para CADA ATM com pelo menos um alerta:
        - Informe as métricas que violaram pelo menos uma vez (lista compacta em **negrito**, métricas únicas, separadas por vírgula).
        - Informe o DIA (YYYY-MM-DD) em que aquele ATM teve a MAIOR quantidade de alertas e quantos alertas ocorreram nesse dia.
        - Se houver mensagens brutas da ETL para esse ATM, copie-as literalmente conforme regra (veja FORMATO).
        - NÃO liste cada alerta individualmente fora dos requisitos acima.
        - NÃO crie bullets de apoio, subtópicos ou seções adicionais além do template permitido.

        --------------------
        FORMATO DE SAÍDA (OBRIGATÓRIO - STRICT)
        --------------------
        A saída DEVE corresponder exatamente a este modelo. NÃO CRIE bullets em outros lugares.

        ## Relatório de Monitoramento

        ## Sumário Factual
        - Total de ATMs monitorados (amostra): X
        - Total de ATMs com alertas: Y
        - Total de ATMs sem alertas: Z
        - Total de alertas em **CPU**: A
        - Total de alertas em **RAM**: B
        - Total de alertas em **DISCO**: C
        - Total de alertas em **PACOTES_PERDIDOS**: D
        (Se existirem outras métricas, listá-las em seguida na ordem alfabética, cada uma em sua própria linha com o mesmo formato.)

        ---

        ## Detalhamento de ATMs APENAS COM ALERTAS
        - Observação: Apresente dados agregados por ATM; NÃO descreva cada alerta individualmente.

        - Primeiro repita a somatória de erros por componente (mesmo formato do Sumário Factual), por exemplo:
        - Total de alertas em **CPU**: A
        - Total de alertas em **RAM**: B
        - ...

        - Em seguida, para CADA ATM COM ALERTAS, gere APENAS UM BULLET por ATM com esta linha EXATA (ordenados por ID crescente):
        - \`[ID_ATM]\` — Métricas com violações: **MET1**, **MET2**; Dia com mais alertas: YYYY-MM-DD (N alertas)

        - Se houver mensagens brutas da ETL para esse ATM, imediatamente após a linha anterior, inclua EXATAMENTE o bloco abaixo (sub-bullets permitidos aqui SOMENTE para as mensagens ETL):
            - Alertas ETL:
            - "mensagem ETL 1"
            - "mensagem ETL 2"

        Regras sobre esses sub-bullets ETL:
        - Somente inclua "Alertas ETL:" se houver pelo menos 1 mensagem bruta.
        - Copie as mensagens literalmente, preservando pontuação e aspas se presentes.
        - Se houver mais de 10 mensagens, inclua apenas as primeiras 10 e adicione um único bullet: - "X mensagens adicionais omitidas".

        - Se NÃO houver ATMs com alertas, escreva exatamente:
        - Nenhum ATM com alertas identificado no período analisado.

        ---

        ## ATMs Sem Alertas
        - Se houver 10 ou menos ATMs sem alertas, liste-os como bullets com inline code:
        - \`ID: 02bbbdc02bf9\`
        - Se houver mais de 10 ATMs sem alertas, não liste IDs; apenas informe a contagem, por exemplo:
        - 1022 ATMs sem alertas registrados no período analisado.

        ---

        REGRAS ADICIONAIS (para evitar listas indesejadas)
        - PROIBIDO criar listas numeradas, listas com marcadores, ou bullets em qualquer outro ponto do documento além dos locais explicitamente permitidos acima.
        - PROIBIDO subdividir o detalhamento do ATM em múltiplas linhas/bullets (exceto o único bullet por ATM e o subsequente bloco "Alertas ETL" caso exista).
        - Se o modelo tiver dúvidas sobre formatação, deve exigir que o orquestrador re-enquadre o dado — NÃO inventar listas.

        --------------------
        EXEMPLO DE SAÍDA IDEAL (APENAS PARA MODELAR O FORMATO)
        --------------------

        ## Relatório de Monitoramento

        ## Sumário Factual
        - Total de ATMs monitorados (amostra): 10
        - Total de ATMs com alertas: 8
        - Total de ATMs sem alertas: 2
        - Total de alertas em **CPU**: 37
        - Total de alertas em **RAM**: 12
        - Total de alertas em **DISCO**: 5
        - Total de alertas em **PACOTES_PERDIDOS**: 8

        ---

        ## Detalhamento de ATMs APENAS COM ALERTAS
        - Total de alertas em **CPU**: 37
        - Total de alertas em **RAM**: 12
        - Total de alertas em **DISCO**: 5
        - Total de alertas em **PACOTES_PERDIDOS**: 8

        - \`02bbbdc02bf9\` — Métricas com violações: **CPU**, **RAM**; Dia com mais alertas: 2025-11-15 (5 alertas)
        - Alertas ETL:
            - "CPU acima do limite configurado"
            - "RAM acima do limite configurado"
        - \`16c3ad24476b\` — Métricas com violações: **PACOTES_PERDIDOS**; Dia com mais alertas: 2025-11-14 (3 alertas)

        ---

        ## ATMs Sem Alertas
        - \`ID: d8408e1114d1\`
    `

    const jsonString = JSON.stringify(dadosJSON, null, 2);
    const promptUsuario = `
        Realize a análise do arquivo CSV anexado utilizando as configurações abaixo.

        <config_json>
        ${jsonString}
        </config_json>

        Instruções:
        1. O arquivo CSV anexado contém o histórico de monitoramento.
        2. Use o objeto JSON acima para definir os limites de CPU, RAM, etc.
        3. Gere apenas o conforme o template do sistema em MARKDOWN.
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
        const cpuCheck = req.body.cpu;
        const ramCheck = req.body.ram;
        const discoCheck = req.body.disco;
        const redeCheck = req.body.rede;

        const dadosCompletosS3 = await dadosS3PorPeriodo(fkEmpresa, periodoInicio, periodoFim);

        const dadosLimpos = dadosCompletosS3.map(item => {
            const novoItem = { ...item };

            if(!cpuCheck){
                delete novoItem.cpu;
            }
            if(!ramCheck){
                delete novoItem.ram;
            }
            if(!discoCheck){
                delete novoItem.disco;
            }
            if(!redeCheck){
                delete novoItem.bytes_enviados;
                delete novoItem.bytes_recebidos;
                delete novoItem.pacotes_perdidos;
            }

            return novoItem;
        });

        const componentesParametro = await buscarParametroPorComponente();

        const csvString = converterParaCSV(dadosLimpos);
        const csvBuffer = Buffer.from(csvString, 'utf-8');

        const arquivoGemini = await uploadArquivoParaGemini(csvBuffer, 'relatorio_dados.csv', 'text/csv');

        if (req.url === '/favicon.ico') {
            return res.status(204).end();
        }

        let dadosDoRequest = {
            "periodo_analise": `${periodoInicio} a ${periodoFim}`,
            "limites_saudaveis": componentesParametro,
            "componentes_analisar": {
                "cpu": cpuCheck,
                "ram": ramCheck,
                "disco": discoCheck,
                "rede": redeCheck
            }
        };

        let textoAnalise = await agenteAnalise(dadosDoRequest, arquivoGemini);

        await genAI.files.delete({ name: arquivoGemini.name });
        textoAnalise = limparTextoIA(textoAnalise);

        console.log(textoAnalise)
        
        let textoRecomendacoes = await agenteRecomendacoes(textoAnalise);
        textoRecomendacoes = limparTextoIA(textoRecomendacoes)

        const relatorioParcial = textoAnalise + "\n\n" + textoRecomendacoes;

        let textoSumarizado = await agenteSumarizacao(relatorioParcial);
        textoSumarizado = limparTextoIA(textoSumarizado)

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

                    /* --- TABELA PROFISSIONAL (O Segredo) --- */
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                        font-size: 11px;
                        page-break-inside: auto;
                    }
                    
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    
                    th {
                        background-color: #f2f2f2;
                        border-bottom: 2px solid #000;
                        text-align: left;
                        padding: 8px;
                        font-weight: bold;
                        text-transform: uppercase;
                        font-size: 10px;
                    }

                    td {
                        border-bottom: 1px solid #ddd;
                        padding: 8px;
                        vertical-align: top;
                    }

                    /* Zebrado (linhas alternadas) para facilitar leitura */
                    tr:nth-child(even) { background-color: #fcfcfc; }

                    /* Coluna de Desvio em vermelho se for alto */
                    td:last-child { font-weight: bold; color: #d32f2f; }

                    /* --- LISTAS --- */
                    ul { list-style-type: disc; margin: 10px 0; padding-left: 20px; }
                    li { margin-bottom: 5px; }

                    .tabela-auditoria {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                        font-size: 11px;
                        border: 1px solid #ddd;
                    }
                    .tabela-auditoria th {
                        background-color: #333;
                        color: #fff;
                        text-align: left;
                        padding: 8px;
                    }
                    .tabela-auditoria td {
                        border-bottom: 1px solid #eee;
                        padding: 8px;
                        color: #333;
                    }
                    .tabela-auditoria tr:nth-child(even) { background-color: #f9f9f9; }
                    .tabela-auditoria strong { color: #d32f2f; }

                    /* --- ESTILO DA CAIXA DE SUCESSO (Só aparece se estiver tudo bem) --- */
                    .box-sucesso {
                        background-color: #d4edda;
                        color: #155724;
                        border: 1px solid #c3e6cb;
                        padding: 15px;
                        border-radius: 5px;
                        text-align: center;
                        font-weight: bold;
                        margin-top: 20px;
                        font-size: 12px;
                    }

                    /* TABELA DE CRÍTICOS (VERMELHO) */
                    .tabela-critica {
                        width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;
                        border: 1px solid #f5c6cb;
                    }
                    .tabela-critica th { 
                        background-color: #721c24; /* Vinho */
                        color: #fff; 
                        padding: 8px; text-align: left; 
                    }
                    .tabela-critica td { 
                        border-bottom: 1px solid #f5c6cb; 
                        padding: 8px; 
                        color: #721c24;
                        background-color: #f8d7da; /* Fundo rosinha */
                    }

                    /* TABELA DE RISCO (AMARELO) */
                    .tabela-risco {
                        width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;
                        border: 1px solid #ffeeba;
                    }
                    .tabela-risco th { 
                        background-color: #ffc107; /* Amarelo Ouro */
                        color: #000; 
                        padding: 8px; text-align: left; 
                    }
                    .tabela-risco td { 
                        border-bottom: 1px solid #ffeeba; 
                        padding: 8px; 
                        color: #856404;
                        background-color: #fff3cd; /* Fundo amarelo claro */
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

async function avaliarRelatorio(req, res) {
    const idRelatorio = req.body.idRelatorio;
    const avaliacao = req.body.avaliacao;

    try{
        const resultado = await avaliar(idRelatorio, avaliacao)

        return res.status(200).json({
            "sucesso": true,
            "idRelatório": idRelatorio,
            "avaliação": avaliacao,
            "result": resultado
        })
    } catch (error) {
        console.error('[RELATORIO] Erro ao avaliar relatório:', error);
        return res.status(500).json({ erro: error.message || error });
    }
}

module.exports = { gerarRelatorio, listarRelatorios, avaliarRelatorio }