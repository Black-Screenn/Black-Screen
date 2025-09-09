    CREATE database if not exists blackscreen;

    use blackscreen;

    create table empresa (
        idEmpresa int not null auto_increment,
        nome varchar(45) not null,
        cnpj char(14) not null,
        primary key (idEmpresa),
        unique key (cnpj)
    );

    INSERT INTO empresa (nome, cnpj) VALUES("TecBan","01234567890123");
    INSERT INTO empresa(nome, cnpj) VALUES("BlackScreen", "12312312312312");
    INSERT INTO empresa (nome, cnpj) VALUES("TecBan","01234567890123");

    

    create table usuario (
        idUsuario int primary key auto_increment,
        nome varchar(50) not null,
        senha varchar(12) not null,
        email varchar(64) not null,
        fkEmpresa int not null,
        foreign key (fkEmpresa) references empresa (idEmpresa),
        unique key (email)
    );

    INSERT INTO usuario(nome, senha, email, fkEmpresa) VALUES("Lucas","Sptech#2025","lucas.aquino@sptech.school",1);
    INSERT INTO usuario(nome, senha, email, fkEmpresa) VALUES("Miguel","Sptech#2025","miguel.magalhes@sptech.school",1);
    INSERT INTO usuario(nome, senha, email, fkEmpresa) VALUES("Pedro","Sptech#2025","pedro.amaral@sptech.school",1);
    INSERT INTO usuario(nome, senha, email, fkEmpresa) VALUES("Hanieh","Sptech#2025","hanieh.Ashouri@sptech.school",1);
    INSERT INTO usuario(nome, senha, email, fkEmpresa) VALUES("Vitorio","Sptech#2025","vitorio.bearari@sptech.school",1);


    create table caixas (
        idCaixa int auto_increment primary key,
        codigoCaixa varchar(10) not null,
        fkEmpresa int not null,
        foreign key (fkEmpresa) references empresa (idEmpresa),
        unique key (codigoCaixa)
    );

    create table endereco (
        idEndereco int primary key auto_increment,
        cep char(9) not null,
        logradouro varchar(200) not null,
        numero varchar(20) not null,
        complemento varchar(200),
        bairro varchar(100) not null,
        cidade varchar(100) not null,
        uf char(2) not null,
        fkCaixa int not null,
        foreign key (fkCaixa) references caixas (idCaixa),
        unique key (fkCaixa)
    );

    create table desempenho (
        idDesempenho int auto_increment primary key,
        cpu_percent decimal(5,2) not null,
        ram_percent decimal(5,2) not null,
        disco_percent decimal(5,2) not null,
        fkCaixa int,
        foreign key (fkCaixa) references caixas (idCaixa)
    );

    create table componentes(
        idComponente int auto_increment primary key,
        unidade varchar(20),
        componente varchar(20),
        fkCaixa int,
        foreign key (fkCaixa) references caixas (idCaixa)
    );

    create view vw_alertas as
    select 
        d.idDesempenho,
        d.fkCaixa,
        d.cpu_percent,
        d.ram_percent,
        d.disco_percent,
        case
            when d.cpu_percent > 90 then 'ALERTA CPU'
            when d.ram_percent > 90 then 'ALERTA RAM'
            when d.disco_percent > 90 then 'ALERTA DISCO'
            else 'OK'
        end as alerta
    from desempenho d;