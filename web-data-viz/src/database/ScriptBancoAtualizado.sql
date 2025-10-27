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
    codigoCaixa VARCHAR(12) UNIQUE,
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
