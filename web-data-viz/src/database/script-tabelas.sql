CREATE database blackscreen;

use blackscreen;

CREATE TABLE empresa (
    idEmpresa INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(45) NOT NULL,
    cnpj CHAR(14) NOT NULL,
    PRIMARY KEY (idEmpresa)
  );
  

CREATE TABLE usuario (
    idUsuario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL,
    senha VARCHAR(12) NOT NULL,
    email VARCHAR(64) NOT NULL,
    fkEmpresa INT NOT NULL,
    FOREIGN KEY (fkEmpresa) REFERENCES empresa (idEmpresa)
  );