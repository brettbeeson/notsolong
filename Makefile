SHELL := /bin/bash

VENVDIR := .venv
PYTHON := uv run python
BACKEND := backend
FRONTEND := frontend
PODMAN ?= podman
COMPOSE_FILE ?= podman-compose.yml
COMPOSE := $(PODMAN) compose -f $(COMPOSE_FILE)

.PHONY: podman-build podman-up podman-down podman-logs podman-seed dev clean

help:
	@echo "Makefile commands:"
	@echo "  podman-build       - Build container images"
	@echo "  podman-up          - Start the Podman pod"
	@echo "  podman-down        - Stop the Podman pod"
	@echo "  podman-logs        - Tail logs from the Django container"
	@echo "  podman-seed        - Run the demo seed command inside the web container"
	@echo "  dev                - Run both backend and frontend development servers"
	@echo "  clean              - Clean up generated files"

run:
	cd $(BACKEND) && $(MAKE) run & \
	cd $(FRONTEND) && $(MAKE) run

podman-build:
	$(COMPOSE) build

podman-up:  
	$(COMPOSE) up -d

podman-down:
	$(COMPOSE) down

podman-logs:
	$(COMPOSE) logs -f web

podman-seed:
	$(COMPOSE) exec web python manage.py createuser
	$(COMPOSE) exec web python manage.py seed --force

	