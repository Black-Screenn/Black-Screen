DROP DATABASE IF EXISTS BlackScreen;
CREATE DATABASE BlackScreen;
USE BlackScreen;

-- ==========================================================
-- 1. CRIAÇÃO DAS TABELAS
-- ==========================================================

CREATE TABLE Enderecos (
    Id_Endereco INT AUTO_INCREMENT PRIMARY KEY,
    Cep VARCHAR(9),
    Pais VARCHAR(255),
    Cidade VARCHAR(255),
    UF VARCHAR(255),
    Logradouro VARCHAR(255),
    Numero INT,
    Latitude DECIMAL(10,8),
    Longitude DECIMAL(11,8),
    Bairro VARCHAR(100),
    Complemento VARCHAR(200)
);

CREATE TABLE Empresa (
    Id_Empresa INT AUTO_INCREMENT PRIMARY KEY,
    Nome_Empresa VARCHAR(255),
    Cnpj VARCHAR(255) UNIQUE,
    Fk_Endereco INT,
    CONSTRAINT FK_Empresa_Endereco
        FOREIGN KEY (Fk_Endereco) REFERENCES Enderecos(Id_Endereco)
);

CREATE TABLE Cargo (
    Id_Cargo INT AUTO_INCREMENT PRIMARY KEY,
    Nome_Cargo VARCHAR(255) NOT NULL,
    Fk_Empresa INT,
    CONSTRAINT FK_Cargo_Empresa
        FOREIGN KEY (Fk_Empresa) REFERENCES Empresa(Id_Empresa)
);

CREATE TABLE Usuario (
    Id_Usuario INT AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(255),
    Email VARCHAR(255) UNIQUE,
    Senha VARCHAR(255),
    Fk_Empresa INT,
    Fk_Cargo INT,
    CONSTRAINT FK_Usuario_Empresa
        FOREIGN KEY (Fk_Empresa) REFERENCES Empresa(Id_Empresa),
    CONSTRAINT FK_Usuario_Cargo
        FOREIGN KEY (Fk_Cargo) REFERENCES Cargo(Id_Cargo)
);

CREATE TABLE Caixa (
    Id_Caixa INT AUTO_INCREMENT PRIMARY KEY,
    Macaddress VARCHAR(36) UNIQUE,
    codigoCaixa VARCHAR(52),
    Fk_Endereco_Maquina INT,
    Fk_Empresa INT,
    CONSTRAINT FK_Caixa_Endereco
        FOREIGN KEY (Fk_Endereco_Maquina) REFERENCES Enderecos(Id_Endereco),
    CONSTRAINT FK_Caixa_Empresa
        FOREIGN KEY (Fk_Empresa) REFERENCES Empresa(Id_Empresa)
);

CREATE TABLE Componentes (
    Id_Componente INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    Nome_Componente VARCHAR(255) NOT NULL,
    Unidade VARCHAR(20),
    Fk_Empresa INT NOT NULL,
    CONSTRAINT FK_Componentes_Empresa
        FOREIGN KEY (Fk_Empresa) REFERENCES Empresa(Id_Empresa)
        ON DELETE CASCADE
);

CREATE TABLE Caixa_Componente (
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

CREATE TABLE Parametros (
    Id_Parametro INT AUTO_INCREMENT PRIMARY KEY,
    Valor_Parametrizado DECIMAL(10,2) NOT NULL, -- Mudei para Decimal para aceitar pontos se precisar
    Fk_Componente INT,
    CONSTRAINT FK_Parametros_Componentes
        FOREIGN KEY (Fk_Componente) REFERENCES Componentes(Id_Componente)
);

CREATE TABLE Permissao (
    Id_Permissao INT AUTO_INCREMENT PRIMARY KEY,
    Nome_Permissao VARCHAR(255) NOT NULL UNIQUE,
    Descricao_Permissao VARCHAR(255)
);

CREATE TABLE CargoPermissao (
    Fk_Cargo INT NOT NULL,
    Fk_Permissao INT NOT NULL,
    CONSTRAINT PK_CargoPermissao
        PRIMARY KEY (Fk_Cargo, Fk_Permissao),
    CONSTRAINT FK_CargoPermissao_Cargo
        FOREIGN KEY (Fk_Cargo) REFERENCES Cargo(Id_Cargo),
    CONSTRAINT FK_CargoPermissao_Permissao
        FOREIGN KEY (Fk_Permissao) REFERENCES Permissao(Id_Permissao)
);

CREATE TABLE Relatorio (
    Id_Relatorio INT PRIMARY KEY AUTO_INCREMENT,
    Fk_Empresa INT,
    Link_Relatorio VARCHAR(2048),
    Conteudo_Texto TEXT,
    Avaliacao FLOAT DEFAULT 0.0,
    Periodo_Inicio DATE,
    Periodo_Fim DATE,
    Data_Geracao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Fk_Empresa) REFERENCES Empresa(Id_Empresa)
);

-- ==========================================================
-- 2. INSERÇÃO DE DADOS (POPULAÇÃO)
-- ==========================================================

INSERT INTO Enderecos (Cep, Pais, Cidade, UF, Logradouro, Numero, Latitude, Longitude, Bairro, Complemento) VALUES
('01310-100', 'Brasil', 'Sao Paulo', 'SP', 'Av. Paulista', 1000, -23.56168, -46.65598, 'Bela Vista', 'Andar 10'),
('04543-907', 'Brasil', 'Sao Paulo', 'SP', 'Av. Pres. Juscelino Kubitschek', 2041, -23.58998, -46.68987, 'Vila Olimpia', 'Shopping JK'),
('01001-000', 'Brasil', 'Sao Paulo', 'SP', 'Praça da Se', 1, -23.55052, -46.63331, 'Se', 'Ao lado do metrô'),
('69000-000', 'Brasil', 'Manaus', 'AM', 'Rua das Flores', 452, -3.10194, -60.02528, 'Centro', 'Loja 1'),
('40000-000', 'Brasil', 'Salvador', 'BA', 'Av. Oceanica', 1230, -12.97111, -38.51083, 'Barra', 'Loja 2'),
('90000-000', 'Brasil', 'Porto Alegre', 'RS', 'Av. Borges de Medeiros', 300, -30.02778, -51.22833, 'Centro Historico', 'Loja 3'),
('70000-000', 'Brasil', 'Brasilia', 'DF', 'Esplanada dos Ministerios', 5, -15.79423, -47.88251, 'Zona Civico-Administrativa', 'Loja 4'),
('30000-000', 'Brasil', 'Belo Horizonte', 'MG', 'Av. Afonso Pena', 1500, -19.91668, -43.93449, 'Centro', 'Loja 5'),
('80000-000', 'Brasil', 'Curitiba', 'PR', 'Rua XV de Novembro', 800, -25.42969, -49.27136, 'Centro', 'Loja 6'),
('50000-000', 'Brasil', 'Recife', 'PE', 'Av. Boa Viagem', 4500, -8.06206, -34.89311, 'Boa Viagem', 'Loja 7'),
('06020-010', 'Brasil', 'Osasco', 'SP', 'Av. dos Autonomistas', 1400, -23.54140, -46.76662, 'Vila Yara', 'Shopping União de Osasco');

INSERT INTO Empresa (Nome_Empresa, Cnpj, Fk_Endereco) VALUES
('Banrisul', '12.345.678/0001-99', 1);

INSERT INTO Cargo (Nome_Cargo, Fk_Empresa) VALUES
('Admin', 1),
('Analista', 1),
('Tecnico de Suporte', 1);

INSERT INTO Usuario (Nome, Email, Senha, Fk_Empresa, Fk_Cargo) VALUES
('Josh Admin', 'admin@banrisul.com', '12345', 1, 1),
('Matheus Borges', 'matheusborges@banrisul.com', '12345', 1, 2),
('Edson Moore', 'edson@banrisul.com', '12345', 1, 3);

-- AQUI ADICIONEI OS COMPONENTES DO SEU CSV
INSERT INTO Componentes (Nome_Componente, Unidade, Fk_Empresa) VALUES
('CPU', '%', 1), -- ID 1
('RAM', '%', 1), -- ID 2 (Mudei pra % pois no CSV parece percentual)
('Disco', 'GB', 1), -- ID 3
('Rede - Bytes Enviados', 'Bytes', 1), -- ID 4
('Rede - Bytes Recebidos', 'Bytes', 1), -- ID 5
('Rede - Pacotes Perdidos', 'Qtd', 1); -- ID 6

INSERT INTO Parametros (Valor_Parametrizado, Fk_Componente) VALUES
(85.00, 1),
(80.00, 2),
(30.00, 6);

INSERT INTO Permissao (Nome_Permissao, Descricao_Permissao) VALUES
('DASHBOARD_FULL', 'Acesso completo aos gráficos'),
('DASHBOARD_VIEW', 'Apenas visualização');

INSERT INTO CargoPermissao (Fk_Cargo, Fk_Permissao) VALUES
(1, 1),
(2, 1),
(3, 2);

INSERT INTO Caixa (Macaddress, codigoCaixa, Fk_Endereco_Maquina, Fk_Empresa)
VALUES
('02bbbdc02bf9', 'ATM-SP-AVP-01', 1, 1),
('16c3ad24476b', 'ATM-SP-JKB-01', 2, 1),
('1817c27bfb2d', 'ATM-SP-PSE-01', 3, 1),
('28b582796f26', 'ATM-MAO-CEN-01', 4, 1),
('56d446c142d2', 'ATM-SAL-BAR-01', 5, 1),
('963c48bb0adf', 'ATM-POA-HIS-01', 6, 1),
('bc7673e2bc48', 'ATM-BSB-CIV-01', 7, 1),
('c8a006971278', 'ATM-BHZ-CEN-01', 8, 1),
('d8408e1114d1', 'ATM-CUR-CEN-01', 9, 1),
('f0185cdf891b', 'ATM-REC-BOA-01', 10, 1),
('185691056330935', 'ATM-OSA-UNI-01', 11, 1);

INSERT INTO Caixa_Componente (Fk_Caixa, Fk_Componente)
SELECT c.Id_Caixa, comp.Id_Componente
FROM Caixa c
JOIN Componentes comp ON c.Fk_Empresa = comp.Fk_Empresa
WHERE c.Macaddress IN ('02bbbdc02bf9', '16c3ad24476b', '1817c27bfb2d', '28b582796f26', '56d446c142d2', '963c48bb0adf', 'bc7673e2bc48', 'c8a006971278', 'd8408e1114d1', 'f0185cdf891b', '185691056330935')
AND c.Fk_Empresa = 1
ON DUPLICATE KEY UPDATE
Caixa_Componente.Data_Associacao = Caixa_Componente.Data_Associacao;
