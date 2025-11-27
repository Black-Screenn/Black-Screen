const { GoogleGenAI } = require('@google/genai');
const MarkdownIt = require('markdown-it');
const puppeteer = require('puppeteer');
const crypto = require('crypto');

const { uploadRelatorioS3 } = require('./cloudController.js');
const { buscarParametroPorComponente } = require('../models/componenteModel.js')
const { cadastrar, listar } = require('../models/relatorioModel.js');

const genAI = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
const modelo = "gemini-2.5-flash";
const md = new MarkdownIt();

async function agenteAnalise(dadosJSON) {
    console.log("[GERAR RELATORIO] [1/4] Iniciando Módulo de Análise");

    const instrucaoSistemaAnalise = `
        **AVISO: SUA ÚNICA TAREFA É REFORMATAR DADOS. VOCÊ É UM ESCRITURÁRIO DE DADOS.**
        
        Sua única função é fazer relatório em Markdown puramente factual.
        
        **REGRAS DE PROIBIÇÃO (MUITO IMPORTANTE):**
        1.  **NÃO USE** as palavras: "Sumário Executivo", "Conclusões", "Recomendações", "Resumo", "Próximos Passos".
        2.  **NÃO USE** palavras de julgamento: "Crítico", "Alerta", "Saudável", "Problema", "Risco", "Exigindo atenção", "Intervenção imediata".
        3.  **NÃO ANALISE** ou dê "Observações". Apenas liste os fatos.
        4. **NÃO RETORNE** Json ou Código.
        
        Outros agentes farão a análise e as recomendações. Você será penalizado por adicionar qualquer opinião.

        **Formato de Saída (Obrigatório):**
        1.  Crie uma seção "## Sumário Factual". Liste APENAS contagens (Total Monitorado, Com Alertas, Sem Alertas).
        2.  Crie uma seção "## Detalhamento de ATMs APENAS COM ALERTAS".
        3.  Para CADA ATM nesta seção, crie "### ID: [ID_ATM]".
        4.  Liste as métricas que VIOLARAM o limite (use **negrito**).
        5.  Liste os alertas brutos da ETL.
        6.  Crie uma seção "## ATMs Sem Alertas".
        7.  Nesta seção, **NÃO LISTE MÉTRICAS**. Se houver 10 ou menos, liste apenas os IDs. Se hove mais de 10, informe apenas a contagem (Ex: "1022 ATMs operando normalmente").
        8. SUA SAIDA É APENAS EM **MARKDOWN**

        **SIGA RIGOROSAMENTE ESSE PADRAO DE SAIDA:**
        ## Sumário Factual
        * Total de ATMs Monitorados (Amostra): 4
        * Total com Alertas: 2
        * Total Sem Alertas: 2

        ---

        ## Detalhamento de ATMs com Alertas

        ### ID: 00:00:00:00:00:00
        * Métricas (Picos):
            * **CPU: 92.5%** (Limite: 80.0%)
            * **RAM: 86.1%** (Limite: 85.0%)
            * **Pacotes Perdidos: 780** (Limite: 500)
            * Disco Atual: 35.6%
        * Alertas Registrados (ETL):
            * "Alerta de CPU, 00:00:00:00:00:00, Pico de uso da CPU atingiu 92.5%, 2025-11-11 10:30:35"
            * "Alerta de RAM, 00:00:00:00:00:00, Pico de uso da RAM atingiu 86.1%, 2025-11-11 10:32:00"
            * "Alerta de Rede, 00:00:00:00:00:00, Perda de pacotes (780) excedeu limite, 2025-11-11 11:00:00"

        ### ID: 00:0A:95:9D:68:16
        * Métricas (Picos):
            * **Disco Atual: 94.2%** (Limite: 90.0%)
            * CPU: 70.0%
            * RAM: 65.0%
            * Pacotes Perdidos: 50
        * Alertas Registrados (ETL):
            * "Alerta de Disco, 00:0A:95:9D:68:16, Uso de Disco Atingiu 94.2%, 2025-11-11 08:22:00"

        ---

        ## ATMs Sem Alertas
        00:1A:55:7D:14:B2, 00:1B:44:11:3A:B7
    `;

    const promptUsuario = `
        Você é o primeiro modulo do meu relatório, eu preciso que você pegue esse JSON, e refatore ele e me retorne o inicio do relatório sem qualquer julgamento, pois será responsabilidade dos proximos modulos. É importante que ele comece com um subtítulo (##) "Relatório de Monitoramento".
        \`\`\`json
        ${JSON.stringify(dadosJSON, null, 2)}
        \`\`\`
    `;

    try {
        const result = await genAI.models.generateContent({
            model: modelo,
            systemInstruction: instrucaoSistemaAnalise,
            contents: promptUsuario
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

        const componentesParametro = await buscarParametroPorComponente();

        if (req.url === '/favicon.ico') {
            return res.status(204).end();
        }

        let dadosDoRequest = {
            "periodo_analise": `${periodoInicio} a ${periodoFim}`,
            "limites_saudaveis": componentesParametro,
            "todos_atms_monitorados": [
                {
                "id_atm": "00:00:00:00:00:00",
                "metricas_historico": {
                    "cpu_max_registrado": 92.5,
                    "cpu_media": 51.5,
                    "ram_max_registrada": 86.1,
                    "disco_percent_atual": 35.6,
                    "pacotes_perdidos_total": 780
                },
                "historico_alertas_etl": [
                    "Alerta de CPU, 00:00:00:00:00:00, Pico de uso da CPU atingiu 92.5%, 2025-11-11 10:30:35",
                    "Alerta de RAM, 00:00:00:00:00:00, Pico de uso da RAM atingiu 86.1%, 2025-11-11 10:32:00",
                    "Alerta de Rede, 00:00:00:00:00:00, Perda de pacotes (780) excedeu limite, 2025-11-11 11:00:00"
                ]
                },
                {
                "id_atm": "00:0A:95:9D:68:16",
                "metricas_historico": {
                    "cpu_max_registrado": 70.0,
                    "cpu_media": 30.2,
                    "ram_max_registrada": 65.0,
                    "disco_percent_atual": 94.2,
                    "pacotes_perdidos_total": 50
                },
                "historico_alertas_etl": [
                    "Alerta de Disco, 00:0A:95:9D:68:16, Uso de Disco Atingiu 94.2%, 2025-11-11 08:22:00"
                ]
                },
                {
                "id_atm": "00:1A:55:7D:14:B2",
                "metricas_historico": {
                    "cpu_max_registrado": 45.0,
                    "cpu_media": 22.1,
                    "ram_max_registrada": 50.5,
                    "disco_percent_atual": 25.0,
                    "pacotes_perdidos_total": 10
                },
                "historico_alertas_etl": []
                },
                {
                "id_atm": "00:1B:44:11:3A:B7",
                "metricas_historico": {
                    "cpu_max_registrado": 68.0,
                    "cpu_media": 30.0,
                    "ram_max_registrada": 61.0,
                    "disco_percent_atual": 33.0,
                    "pacotes_perdidos_total": 5
                },
                "historico_alertas_etl": []
                }
            ]
        };

        const textoAnalise = await agenteAnalise(dadosDoRequest);

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

        link = await uploadRelatorioS3(pdfBuffer, "relatorio_"+hash, fkEmpresa);
        cadastrar(link, fkEmpresa, relatorioFinal)

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