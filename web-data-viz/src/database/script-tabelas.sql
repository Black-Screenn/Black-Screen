drop database if exists BlackScreen;

create database BlackScreen;
use BlackScreen;


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
    senha varchar(45) not null,
    email varchar(64) not null,
    fkEmpresa int not null,
    foreign key (fkEmpresa) references empresa (idEmpresa),
    unique key (email)
);

create table caixas (
    idCaixa int auto_increment primary key,
    codigoCaixa varchar(12) not null,
    fkEmpresa int not null,
    foreign key (fkEmpresa) references empresa (idEmpresa),
    unique key (codigoCaixa) 
);

create table endereco (
    idEndereco int primary key auto_increment,
    cep char(9) not null,
    logradouro varchar(200) not null,
    numero varchar(20),
    complemento varchar(200),
    bairro varchar(100) not null,
    cidade varchar(100) not null,
    uf varchar(100) not null,
    pais varchar(100) not null,
    latitude float,
    longitude float,
    fkCaixa int not null,
    foreign key (fkCaixa) references caixas (idCaixa),
    unique key (fkCaixa) 
);

create table p_alerta (
    idDesempenho int auto_increment primary key,
    parametro float not null,                    
    fkCaixa int not null,                        
    foreign key (fkCaixa) references caixas (idCaixa)
);

create table componentes(
    idComponente int auto_increment primary key,
    unidade varchar(20),
    componente varchar(20),
    fkCaixa int not null,
    foreign key (fkCaixa) references caixas (idCaixa)
);

create table componente_alerta (
  idComponenteAlerta int auto_increment primary key,
  fkComponente int not null,
  fkParametro int not null,
  foreign key (fkComponente) references componentes(idComponente),
  foreign key (fkParametro) references p_alerta(idDesempenho),
  unique key (fkComponente, fkParametro) 
);

insert into empresa (nome, cnpj) values
('BlackScreen', '12345678000199'),
('SafeBank Systems', '98765432000177'),
('CaixaProtegida Ltda', '11122233000155');

insert into usuario (nome, senha, email, fkEmpresa) values
('Pedro Amaral', 'senha123', 'pedro@blackscreen.com', 1),
('Vitorio Bearari', 'senha456', 'vitorio@safebank.com', 2),
('Hanieh Ashouri', 'senha789', 'hanieh@caixaprotegida.com', 3);

insert into caixas (codigoCaixa, fkEmpresa) values
('CX001', 1),
('CX002', 1),
('CX101', 2),
('CX201', 3);

insert into endereco (cep, logradouro, numero, complemento, bairro, cidade, uf, fkCaixa, latitude, longitude, pais) values
('01001-000', 'Av. Paulista', '1000', 'Térreo', 'Bela Vista', 'São Paulo', 'SP', 1, -7.948196, -34.890172, "Brasil"),
('02020-000', 'Rua Vergueiro', '200', 'Sala 2', 'Liberdade', 'São Paulo', 'SP', 2, -7.937091, -34.857388, "Brasil"),
('03030-000', 'Rua XV de Novembro', '300', null, 'Centro', 'Curitiba', 'PR', 3, -7.954592, -34.952316, "Brasil"),
('04040-000', 'Av. Atlântica', '400', 'Quiosque 5', 'Copacabana', 'Rio de Janeiro', 'RJ', 4, -5.853801, -36.210938, "Brasil");

insert into p_alerta (parametro, fkCaixa) values
(75.5, 1),
(60.0, 1),
(80.0, 2),
(55.0, 3),
(90.0, 4);

insert into componentes (unidade, componente, fkCaixa) values
('%', 'CPU', 1),
('%', 'Disco', 1),
('%', 'Memória', 2),
('%', 'CPU', 3),
('%', 'Memória', 4);

insert into componente_alerta (fkComponente, fkParametro) values
(1, 1), 
(2, 2), 
(3, 3), 
(4, 4),
(5, 5); 

select emp.nome as empresa,
       c.codigoCaixa,
       comp.componente,
       comp.unidade,
       p.parametro as limite_alerta
from empresa emp
join caixas c on emp.idEmpresa = c.fkEmpresa
join componentes comp on c.idCaixa = comp.fkCaixa
join componente_alerta ca on comp.idComponente = ca.fkComponente
join p_alerta p on ca.fkParametro = p.idDesempenho
where emp.nome = 'BlackScreen'
order by c.codigoCaixa, comp.componente;