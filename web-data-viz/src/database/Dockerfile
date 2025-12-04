FROM mysql:latest
ENV MYSQL_ROOT_PASSWORD=urubu100
RUN echo "CREATE USER IF NOT EXISTS 'usuario'@'%' IDENTIFIED BY 'senha1234@'; GRANT ALL PRIVILEGES ON *.* TO 'usuario'@'%' WITH GRANT OPTION; FLUSH PRIVILEGES;" > /docker-entrypoint-initdb.d/01-user.sql
COPY ./ScriptBancoAtualizado.sql /docker-entrypoint-initdb.d/
EXPOSE 3306
