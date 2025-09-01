CREATE database blackscreen;

use blackscreen;

create table empresa (
    idEmpresa int not null auto_increment,
    nome varchar(45) not null,
    cnpj char(14) not null,
    primary key (idEmpresa),
    unique key (cnpj)
);
  

create table usuario (
    idUsuario int primary key auto_increment,
    nome varchar(50) not null,
    senha varchar(12) not null,
    email varchar(64) not null,
    fkEmpresa int not null,
    foreign key (fkEmpresa) references empresa (idEmpresa),
    unique key (email)
);