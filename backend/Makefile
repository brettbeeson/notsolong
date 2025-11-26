SHELL := /bin/bash
PYTHON := uv run python

.PHONY: install migrate run test superuser user clean seed-demo flush schema

help:
	@echo "Makefile commands:"
	@echo "  install      Install dependencies in the virtual environment"
	@echo "  migrate      Create and apply database migrations"
	@echo "  run          Run the development server"
	@echo "  test         Run the test suite"
	@echo "  schema       Generate OpenAPI schema file"
	@echo "  superuser    Create a Django superuser (requires env vars)"
	@echo "  user         Create a regular user (requires env vars)"
	@echo "  seed         Flush the database, create a user, and seed data"
	@echo "  flush        Flush all data from the database"

migrate:
	$(PYTHON) manage.py makemigrations
	$(PYTHON) manage.py migrate

run:
	$(PYTHON) manage.py runserver

test:
	$(PYTHON) -m pytest

schema:
	$(PYTHON) manage.py generateschema --format openapi > public/schema.yml

superuser:
	@echo "Using DJANGO_SUPERUSER_EMAIL=$(DJANGO_SUPERUSER_EMAIL)"
	@echo "Ensure DJANGO_SUPERUSER_PASSWORD is set in environment"
	$(PYTHON) manage.py createsuperuser --noinput --email "$(DJANGO_SUPERUSER_EMAIL)"

user:
	@echo "Using DJANGO_USER_EMAIL=$(DJANGO_USER_EMAIL)"
	@echo "Ensure DJANGO_USER_PASSWORD is set in environment"
	$(PYTHON) manage.py createuser


clean:
	find . -name "__pycache__" -type d -exec rm -rf {} +

seed: user
	$(PYTHON) manage.py seed --force

flush:
	$(PYTHON) manage.py flush --noinput
