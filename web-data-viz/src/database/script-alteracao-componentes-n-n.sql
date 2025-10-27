-- Script para alterar relacionamento de Componentes de 1:N para N:N
-- Um componente pode estar em vários ATMs (Caixas)

-- 1. Criar tabela intermediária para relacionamento N:N
CREATE TABLE IF NOT EXISTS Caixa_Componente (
    Id_Caixa_Componente INT AUTO_INCREMENT PRIMARY KEY,
    Fk_Caixa INT NOT NULL,
    Fk_Componente INT NOT NULL,
    Data_Associacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_CaixaComponente_Caixa
        FOREIGN KEY (Fk_Caixa) REFERENCES Caixa(Id_Caixa)
        ON DELETE CASCADE,
    CONSTRAINT FK_CaixaComponente_Componente
        FOREIGN KEY (Fk_Componente) REFERENCES Componentes(Id_Componente)
        ON DELETE CASCADE,
    CONSTRAINT UK_Caixa_Componente UNIQUE (Fk_Caixa, Fk_Componente)
);

-- 2. Migrar dados existentes para a tabela intermediária
INSERT INTO Caixa_Componente (Fk_Caixa, Fk_Componente)
SELECT Fk_Caixa, Id_Componente 
FROM Componentes 
WHERE Fk_Caixa IS NOT NULL;

-- 3. Remover a constraint de FK da tabela Componentes
ALTER TABLE Componentes 
DROP FOREIGN KEY FK_Componentes_Caixa;

-- 4. Remover a coluna Fk_Caixa da tabela Componentes
ALTER TABLE Componentes 
DROP COLUMN Fk_Caixa;

-- 5. Adicionar coluna Fk_Empresa em Componentes para saber qual empresa criou o componente
ALTER TABLE Componentes 
ADD COLUMN Fk_Empresa INT NULL AFTER Unidade;

-- 6. Atualizar componentes existentes com a empresa (via Caixa)
UPDATE Componentes c
INNER JOIN Caixa_Componente cc ON c.Id_Componente = cc.Fk_Componente
INNER JOIN Caixa cx ON cc.Fk_Caixa = cx.Id_Caixa
SET c.Fk_Empresa = cx.Fk_Empresa
WHERE c.Fk_Empresa IS NULL;

-- 7. Tornar a coluna Fk_Empresa obrigatória
ALTER TABLE Componentes
MODIFY COLUMN Fk_Empresa INT NOT NULL;

-- 8. Adicionar FK para Empresa
ALTER TABLE Componentes
ADD CONSTRAINT FK_Componentes_Empresa
    FOREIGN KEY (Fk_Empresa) REFERENCES empresa(Id_Empresa)
    ON DELETE CASCADE;
