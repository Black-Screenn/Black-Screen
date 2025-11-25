DROP DATABASE IF EXISTS BlackScreen;
CREATE DATABASE BlackScreen;
USE BlackScreen;

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
    Valor_Parametrizado INT NOT NULL,
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

USE BlackScreen;

INSERT INTO Enderecos (Cep, Pais, Cidade, UF, Logradouro, Numero, Latitude, Longitude, Bairro, Complemento) VALUES
('01310-100', 'Brasil', 'São Paulo', 'SP', 'Av. Paulista', 1000, -23.56168, -46.65598, 'Bela Vista', 'Andar 10'),
('04543-907', 'Brasil', 'São Paulo', 'SP', 'Av. Pres. Juscelino Kubitschek', 2041, -23.58998, -46.68987, 'Vila Olímpia', 'Shopping JK'),
('01001-000', 'Brasil', 'São Paulo', 'SP', 'Praça da Sé', 1, -23.55052, -46.63331, 'Sé', 'Ao lado do metrô');

INSERT INTO Empresa (Nome_Empresa, Cnpj, Fk_Endereco) VALUES
('BlackScreen Solutions', '12.345.678/0001-99', 1);

INSERT INTO Cargo (Nome_Cargo, Fk_Empresa) VALUES
('Admin', 1),              -- ID 1: Vai para dashboardAdm
('Analista', 1),           -- ID 2: Vai para dashboard comum, IS_ADMIN false
('Tecnico de Suporte', 1); -- ID 3: Vai para dashboard comum, IS_ADMIN false

INSERT INTO Usuario (Nome, Email, Senha, Fk_Empresa, Fk_Cargo) VALUES
('Carlos Admin', 'admin@blackscreen.com', '12345', 1, 1),   -- Teste Admin
('Ana Analista', 'ana@blackscreen.com', '12345', 1, 2),     -- Teste Analista
('Pedro Suporte', 'pedro@blackscreen.com', '12345', 1, 3);  -- Teste Técnico

INSERT INTO Caixa (Macaddress, codigoCaixa, Fk_Endereco_Maquina, Fk_Empresa) VALUES
('764275743843724', 'TOTEM-JK-01', 2, 1),
('038473474382445', 'TOTEM-SE-02', 3, 1),
('80160640191877', 'TOTEM-JK-01', 2, 1),
('185691056330935', 'TOTEM-SE-02', 3, 1);
=======

INSERT INTO Componentes (Nome_Componente, Unidade, Fk_Empresa) VALUES
('CPU', '%', 1),       -- ID 1
('Memória RAM', 'GB', 1), -- ID 2
('Disco Rígido', 'GB', 1); -- ID 3

INSERT INTO Caixa_Componente (Fk_Caixa, Fk_Componente) VALUES
(1, 1), (1, 2), (1, 3),
(2, 1), (2, 2), (2, 3);

INSERT INTO Parametros (Valor_Parametrizado, Fk_Componente) VALUES
(90, 1), -- Alerta se CPU passar de 90%
(80, 2); -- Alerta se RAM passar de 80% (Considerando uso percentual ou valor fixo dependendo da sua lógica)

INSERT INTO Permissao (Nome_Permissao, Descricao_Permissao) VALUES
('DASHBOARD_FULL', 'Acesso completo aos gráficos'),
('DASHBOARD_VIEW', 'Apenas visualização');

INSERT INTO CargoPermissao (Fk_Cargo, Fk_Permissao) VALUES
(1, 1), -- Admin tem acesso full
(2, 1), -- Analista tem acesso full
(3, 2); -- Tecnico apenas visualiza
