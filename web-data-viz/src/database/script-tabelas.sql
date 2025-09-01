CREATE database blackscreen;

use blackscreen;

create table empresa (
    idEmpresa int not null auto_increment,
    nome varchar(45) not null,
    cnpj char(14) not null,
    primary key (idEmpresa),
    unique key (cnpj)
);
  

CREATE TABLE usuario (
    idUsuario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL,
    senha VARCHAR(12) NOT NULL,
    email VARCHAR(64) NOT NULL,
    fkEmpresa INT NOT NULL,
    FOREIGN KEY (fkEmpresa) REFERENCES empresa (idEmpresa)
  );