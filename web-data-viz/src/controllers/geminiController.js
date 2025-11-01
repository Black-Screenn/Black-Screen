const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
exports.prompt = async function (req, res){
    
    try {
        
        // ${dadosParaPrompt}
        //    Analise os seguintes dados de um gráfico de "${tipoGrafico}":
        const prompt = `
            Você é um analista de negócios.


            Forneça:
            1  Insight Rápido (máximo 6 linhas): Um resumo das tendências.
            2  Decisões Recomendadas: Duas ações que um gestor poderia tomar.
            3  Foco para o Negócio: O ponto mais crítico que os dados revelam.
        `;


        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        res.json({ insights: text });

    } catch (error) {
        console.error("Erro no geminiController:", error);
        res.status(500).json({ error: 'Falha ao processar a solicitação da IA.' });
    }
};