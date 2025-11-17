
const { GoogleGenerativeAI } = require('@google/generative-ai');
const componenteModel = require('../models/componenteModel');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

exports.prompt = async function (req, res) {

    try {
        console.log('componenteModel:', componenteModel);
        console.log('keys:', Object.keys(componenteModel.buscarParametroPorComponente || {}));
        console.log('typeof buscarParametroPorComponente:', typeof (componenteModel || {}).buscarParametroPorComponente);





        const { dadosJira, componentes, dadosSemanaAtual, dadosSemanaAnterior } = req.body;

        const parametrosBanco = await componenteModel.buscarParametroPorComponente();

        const alertas = componentes.map((comp, index) => {
            const param = parametrosBanco.find(p =>
                comp.toLowerCase().includes(p.Nome_Componente.toLowerCase())
            );

            const atual = dadosSemanaAtual[index];
            const anterior = dadosSemanaAnterior[index];
            const variacao = anterior > 0 ?
                ((atual - anterior) / anterior * 100).toFixed(1) : 'N/A';

            const limite = param ? param.Valor_Parametrizado : null;
            const emAlerta = limite && atual > limite;

            return {
                comp,
                atual,
                anterior,
                variacao,
                limite,
                emAlerta
            };
        }).filter(item => item.atual > 0);

        const prompt = `
Você é um Técnico de Hardware analisando chamados do Jira e parametros do banco de dados.

DADOS:
${alertas.map(a =>
            `${a.comp}: ${a.atual} atual, ${a.anterior} anterior (${a.variacao}%) ${a.limite ? `[Limite: ${a.limite}]` : ''} ${a.emAlerta ? ' ALERTA' : ''}`
        ).join('\n')}

RESPONDA EM 3 TEXTOS CURTOS (máx 10 palavras cada):

1. Insight Principal:
2. Ação Prioritária:
3. Ponto Crítico:
me coloque cada 1 dos pontos dentro de uma tag  br para pular linha em cada um desses insigths
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const insights = response.text();

        res.json({ insights: insights });

    } catch (error) {
        console.error("Erro no geminiController:", error);
        res.status(500).json({ error: 'Falha ao processar a solicitação da IA.' });
    }
};