#!/bin/sh
set -eu
psql --set ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
\getenv app_user APP_DB_USER
\getenv app_password APP_DB_PASSWORD
CREATE ROLE :"app_user" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD :'app_password';
GRANT CONNECT ON DATABASE :DBNAME TO :"app_user";
GRANT USAGE,CREATE ON SCHEMA public TO :"app_user";
SQL
