CREATE DATABASE BlackScreen;
USE BlackScreen;

CREATE TABLE Empresa (
    Id_Empresa INT AUTO_INCREMENT PRIMARY KEY ,
    Nome_Empresa VARCHAR(255),
    Cnpj VARCHAR(255) UNIQUE,
    Fk_Endereco INT
);

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

ALTER TABLE Empresa
ADD CONSTRAINT FK_Empresa_Endereco
FOREIGN KEY (Fk_Endereco) REFERENCES Enderecos(Id_Endereco);

CREATE TABLE Usuario (
    Id_Usuario INT AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(255),
    Email VARCHAR(255) UNIQUE,
    Senha VARCHAR(255),
    Fk_Empresa INT,
    CONSTRAINT FK_Usuario_Empresa
        FOREIGN KEY (Fk_Empresa) REFERENCES Empresa(Id_Empresa)
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
    Id_Componente INT AUTO_INCREMENT PRIMARY KEY not null,
    Nome_Componente VARCHAR(255) not null,
    Fk_Caixa INT not null,
    Unidade VARCHAR(20),
    CONSTRAINT FK_Componentes_Caixa
        FOREIGN KEY (Fk_Caixa) REFERENCES Caixa(Id_Caixa) 
);

CREATE TABLE Parametros (
    Id_Parametro INT AUTO_INCREMENT PRIMARY KEY,
    Valor_Parametrizado INT not null,
    Fk_Componente INT,
    CONSTRAINT FK_Parametros_Componentes
        FOREIGN KEY (Fk_Componente) REFERENCES Componentes(Id_Componente)
);