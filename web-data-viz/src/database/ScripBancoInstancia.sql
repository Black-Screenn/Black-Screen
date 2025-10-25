CREATE DATABASE IF NOT EXISTS BlackScreen;
USE BlackScreen;


CREATE TABLE Enderecos (
    Id_Endereco INT AUTO_INCREMENT PRIMARY KEY,
    Cep VARCHAR(9)NOT NULL,
    Pais VARCHAR(255)NOT NULL,
    Cidade VARCHAR(255)NOT NULL,
    Estado VARCHAR(255)NOT NULL,
    Rua VARCHAR(255)NOT NULL,
    Numero INT ,
    Latitude DECIMAL(10,8) NOT NULL,
    Longitude DECIMAL(11,8)NOT NULL
);


CREATE TABLE Empresa (
    Id_Empresa INT AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(255) NOT NULL,
    Cnpj VARCHAR(255),
    Razao_Social VARCHAR(255),
    Telefone VARCHAR(255),
    Fk_Endereco INT,
    CONSTRAINT Fk_Empresa_Endereco
        FOREIGN KEY (Fk_Endereco) REFERENCES Enderecos(Id_Endereco)
);


CREATE TABLE Computador (
    Id_Computador INT AUTO_INCREMENT PRIMARY KEY,
    Nome_Maquina VARCHAR(255) NOT NULL,
    Fk_Endereco_Maquina INT,
    Fk_Empresa INT,
    CONSTRAINT Fk_Computador_Endereco
        FOREIGN KEY (Fk_Endereco_Maquina) REFERENCES Enderecos(Id_Endereco),
    CONSTRAINT Fk_Computador_Empresa
        FOREIGN KEY (Fk_Empresa) REFERENCES Empresa(Id_Empresa)
);


CREATE TABLE Usuario (
    Id_Usuario INT AUTO_INCREMENT PRIMARY KEY,
    Nome VARCHAR(255) NOT NULL,
    Email VARCHAR(255) UNIQUE,
    Senha VARCHAR(255) NOT NULL,
    Fk_Empresa INT,
    CONSTRAINT Fk_Usuario_Empresa
        FOREIGN KEY (Fk_Empresa) REFERENCES Empresa(Id_Empresa)
);


CREATE TABLE Componentes (
    Id_Componente INT AUTO_INCREMENT PRIMARY KEY,
    Nome_Componente VARCHAR(255) NOT NULL,
    Fk_Computador INT,
    CONSTRAINT Fk_Componentes_Computador
        FOREIGN KEY (Fk_Computador) REFERENCES Computador(Id_Computador)
);

CREATE TABLE Parametros (
    Id_Parametro INT AUTO_INCREMENT PRIMARY KEY,
    Valor_Parametrizado INT NOT NULL,
    Fk_Componente INT,
    CONSTRAINT Fk_Parametros_Componentes
        FOREIGN KEY (Fk_Componente) REFERENCES Componentes(Id_Componente)
);