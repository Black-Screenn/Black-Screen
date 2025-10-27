var database = require("../database/config")

function cadastrar(nome, caixa, unidade, parametro) {
    console.log("ACESSEI O COMPONENTE MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():", nome, caixa, unidade, parametro);
    
    var instrucaoSql = `
        INSERT INTO Componentes (Nome_Componente, Fk_Caixa, Unidade) 
        VALUES ('${nome}', ${caixa}, '${unidade}');
    `; 
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    
    return database.executar(instrucaoSql).then((resultado) => {
        const idComponente = resultado.insertId;
        
        // Inserir parâmetro
        var instrucaoParametro = `
            INSERT INTO Parametros (Valor_Parametrizado, Fk_Componente) 
            VALUES (${parametro}, ${idComponente});
        `;
        console.log("Executando a instrução SQL: \n" + instrucaoParametro);
        return database.executar(instrucaoParametro);
    });
}

function listar(fkEmpresa) {
    console.log("ACESSEI O COMPONENTE MODEL - LISTAR \n \n\t\t >> Empresa:", fkEmpresa);
    
    var instrucaoSql = `
        SELECT 
            c.Id_Componente,
            c.Nome_Componente,
            c.Fk_Caixa,
            c.Unidade,
            cx.codigoCaixa,
            p.Valor_Parametrizado
        FROM Componentes c
        INNER JOIN Caixa cx ON c.Fk_Caixa = cx.Id_Caixa
        LEFT JOIN Parametros p ON c.Id_Componente = p.Fk_Componente
        WHERE cx.Fk_Empresa = ${fkEmpresa}
        ORDER BY c.Id_Componente DESC;
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function editar(idComponente, nome, unidade, parametro) {
    console.log("ACESSEI O COMPONENTE MODEL - EDITAR \n \n\t\t >> ID:", idComponente);
    
    var instrucaoSql = `
        UPDATE Componentes 
        SET Nome_Componente = '${nome}', Unidade = '${unidade}'
        WHERE Id_Componente = ${idComponente};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    
    return database.executar(instrucaoSql).then(() => {
        // Atualizar parâmetro
        var instrucaoParametro = `
            UPDATE Parametros 
            SET Valor_Parametrizado = ${parametro}
            WHERE Fk_Componente = ${idComponente};
        `;
        console.log("Executando a instrução SQL: \n" + instrucaoParametro);
        return database.executar(instrucaoParametro);
    });
}

function excluir(idComponente) {
    console.log("ACESSEI O COMPONENTE MODEL - EXCLUIR \n \n\t\t >> ID:", idComponente);
    
    // Primeiro excluir parâmetros
    var instrucaoParametro = `
        DELETE FROM Parametros WHERE Fk_Componente = ${idComponente};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoParametro);
    
    return database.executar(instrucaoParametro).then(() => {
        // Depois excluir componente
        var instrucaoSql = `
            DELETE FROM Componentes WHERE Id_Componente = ${idComponente};
        `;
        console.log("Executando a instrução SQL: \n" + instrucaoSql);
        return database.executar(instrucaoSql);
    });
}

module.exports = {
    cadastrar,
    listar,
    editar,
    excluir
}