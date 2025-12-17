#!/usr/bin/env bash
set -euo pipefail


# Check all the environment variables we need or fail fast.
: "${POSTGRES_USER:?Environment variable POSTGRES_USER is required}"
: "${POSTGRES_DB:?Environment variable POSTGRES_DB is required}"
: "${DJANGO_DB_USER:?Environment variable DJANGO_DB_USER is required}"
: "${DJANGO_DB_PASSWORD:?Environment variable DJANGO_DB_PASSWORD is required}"
: "${DJANGO_DB_NAME:?Environment variable DJANGO_DB_NAME is required}"

# The Postgres entrypoint provides psql and has already started a temp server.
# Use the bootstrap superuser from your POSTGRES_* env (POSTGRES_USER/DB).
psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" <<SQL

-- Create (or update) the application role.
DO \$\$
BEGIN
	BEGIN
		EXECUTE format('CREATE ROLE %I LOGIN', '${DJANGO_DB_USER}');
	EXCEPTION WHEN duplicate_object THEN
		NULL;
	END;

	EXECUTE format('ALTER ROLE %I WITH LOGIN PASSWORD %L', '${DJANGO_DB_USER}', '${DJANGO_DB_PASSWORD}');
END
\$\$;

-- CREATE DATABASE cannot run inside a DO block/function.
SELECT format('CREATE DATABASE %I OWNER %I', '${DJANGO_DB_NAME}', '${DJANGO_DB_USER}')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '${DJANGO_DB_NAME}')
\gexec

SQL
