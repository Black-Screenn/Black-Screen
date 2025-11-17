    var database = require("../database/config")

    function cadastrar(nome, fkEmpresa, unidade, parametro) {
        console.log("ACESSEI O COMPONENTE MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():", nome, fkEmpresa, unidade, parametro);

        var instrucaoSql = `
            INSERT INTO Componentes (Nome_Componente, Unidade, Fk_Empresa) 
            VALUES ('${nome}', '${unidade}', ${fkEmpresa});
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
        c.Unidade,
        cx.Fk_Empresa,
        p.Valor_Parametrizado,
        GROUP_CONCAT(DISTINCT cx.Id_Caixa) AS Caixas_Ids,
        GROUP_CONCAT(DISTINCT cx.codigoCaixa) AS Caixas_Codigos
        FROM Componentes c
        LEFT JOIN Parametros p ON c.Id_Componente = p.Fk_Componente
        LEFT JOIN Caixa cx ON c.Fk_Caixa = cx.Id_Caixa
        WHERE cx.Fk_Empresa = ${fkEmpresa}
        GROUP BY 
            c.Id_Componente, 
            c.Nome_Componente, 
            c.Unidade, 
            cx.Fk_Empresa, 
            p.Valor_Parametrizado
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

    function associarCaixa(idComponente, idCaixa) {
        console.log("ACESSEI O COMPONENTE MODEL - ASSOCIAR CAIXA \n \n\t\t >> ID Componente:", idComponente, "ID Caixa:", idCaixa);

        var instrucaoSql = `
            INSERT INTO Caixa_Componente (Fk_Caixa, Fk_Componente) 
            VALUES (${idCaixa}, ${idComponente})
            ON DUPLICATE KEY UPDATE Fk_Caixa = ${idCaixa};
        `;
        console.log("Executando a instrução SQL: \n" + instrucaoSql);
        return database.executar(instrucaoSql);
    }

    function desassociarCaixa(idComponente, idCaixa) {
        console.log("ACESSEI O COMPONENTE MODEL - DESASSOCIAR CAIXA \n \n\t\t >> ID Componente:", idComponente, "ID Caixa:", idCaixa);

        var instrucaoSql = `
            DELETE FROM Caixa_Componente 
            WHERE Fk_Componente = ${idComponente} AND Fk_Caixa = ${idCaixa};
        `;
        console.log("Executando a instrução SQL: \n" + instrucaoSql);
        return database.executar(instrucaoSql);
    }

    function listarPorCaixa(idCaixa) {
        console.log("ACESSEI O COMPONENTE MODEL - LISTAR POR CAIXA \n \n\t\t >> ID Caixa:", idCaixa);

        var instrucaoSql = `
            SELECT 
                c.Id_Componente,
                c.Nome_Componente,
                c.Unidade,
                c.Fk_Empresa,
                p.Valor_Parametrizado,
                cc.Data_Associacao
            FROM Componentes c
            INNER JOIN Caixa_Componente cc ON c.Id_Componente = cc.Fk_Componente
            LEFT JOIN Parametros p ON c.Id_Componente = p.Fk_Componente
            WHERE cc.Fk_Caixa = ${idCaixa}
            ORDER BY c.Nome_Componente;
        `;
        console.log("Executando a instrução SQL: \n" + instrucaoSql);
        return database.executar(instrucaoSql);
    }

    async function buscarParametroPorComponente() {
        console.log("ACESSEI A TABELA COMPONENTE PARA BUSCAR OS PARAMETROS DESTES COMPONENTES");
        var instrucaoSql = `
            select C.Nome_Componente, P.Valor_Parametrizado
            from Componentes as C
            inner join Parametros  as P on Fk_Componente = Id_Componente;
            `;
        console.log("Executando a instrucao SQL: \n" + instrucaoSql);
        return await database.executar(instrucaoSql);

    }
    module.exports = {
        cadastrar,
        listar,
        editar,
        excluir,
        associarCaixa,
        desassociarCaixa,
        listarPorCaixa,
        buscarParametroPorComponente
    }