SHELL := /bin/bash

PODMAN ?= podman

ENV_FILE = .env.$(ENV)

COMPOSE_REFERENCE := localhost/notsolong_web:latest
COMPOSE := $(PODMAN) compose -p notsolong -f podman-compose.yml
EXPORT_TAR := dist/notsolong-images.tar
REMOTE_HOST := $(REMOTE_HOST)
REMOTE_USER := $(REMOTE_USER)
# This will contain compose files, .env.prod (and pgdata), and is referenced in systemd service file
REMOTE_APP_PATH := /home/$(REMOTE_USER)/notsolong-deploy
REMOTE_IMAGE_PATH := /tmp/notsolong-images.tar

.PHONY: help run podman-build podman-up podman-down podman-logs podman-seed deploy

.ONESHELL:

help:
	@echo "Build and deployment"
	@echo "  deploy        		- Copy to $(REMOTE_HOST) and start service"
	@echo "Local commands:"
	@echo "  podman-build       - Build container images"
	@echo "  podman-up          - Start the Podman pod"
	@echo "  podman-down        - Stop the Podman pod"
	@echo "  podman-logs        - Tail logs from the Django container"
	@echo "  podman-seed        - Run the demo seed command inside the web container"
	@echo "Development"
	@echo "  run                - Run both backend and frontend development servers"

#
# Development
#

run:
	cd backend/ && $(MAKE) run & \
	cd frontend/ && $(MAKE) run

#
# Podman
#

podman-build:
	@$(LOAD_ENV)
	$(COMPOSE) build

podman-up:  
	@$(LOAD_ENV)
	$(COMPOSE) up -d

podman-down:
	@$(LOAD_ENV)
	$(COMPOSE) down

podman-logs:
	@$(LOAD_ENV)
	$(COMPOSE) logs -f web

podman-seed:
	@$(LOAD_ENV)
	$(COMPOSE) exec web python manage.py createuser
	$(COMPOSE) exec web python manage.py seed --force

#
# Deployment
#

deploy:  
	@echo "Loading production environment for deployment"
	@$(LOAD_ENV_PROD)
	@echo "Images with production environment"
	@$(MAKE) podman-build ENV=prod
	
	@echo "Exporting compose image/s to $(EXPORT_TAR)"
	@mkdir -p $(dir $(EXPORT_TAR))
	@rm -f $(EXPORT_TAR) || true  # don't fail if the file doesn't exist
	@IMAGES="$$($(PODMAN) images --filter reference=$(COMPOSE_REFERENCE) --format '{{.Repository}}:{{.Tag}}' | tr '\n' ' ')"; \
	if [ -z "$$IMAGES" ]; then echo "No notsolong images found. Run 'make podman-build' first."; exit 1; fi; \
	echo "Saving $$IMAGES to $(EXPORT_TAR)"; \
	$(PODMAN) save -o $(EXPORT_TAR) $$IMAGES

	@echo "Shipping $(EXPORT_TAR) to $(REMOTE_HOST) and loading images"
	ssh $(REMOTE_HOST) "mkdir -p $(REMOTE_APP_PATH)/pgdata" 
	rsync -avz --progress $(EXPORT_TAR) $(REMOTE_HOST):$(REMOTE_IMAGE_PATH)
	ssh $(REMOTE_HOST) "podman load -i $(REMOTE_IMAGE_PATH)"

	@echo "Copying .env.prod and podman-compose.yml to $(REMOTE_HOST):$(REMOTE_APP_PATH)"
	scp .env.prod $(REMOTE_HOST):$(REMOTE_APP_PATH)/.env.prod
	scp podman-compose.yml $(REMOTE_HOST):$(REMOTE_APP_PATH)/podman-compose.yml
		
	@echo "Installing and starting systemd service on $(REMOTE_HOST)"
	scp systemd/notsolong.service $(REMOTE_HOST):/tmp/notsolong.service
	ssh $(REMOTE_HOST) "set -euo pipefail; \
		sudo loginctl enable-linger $(REMOTE_USER); \
		install -Dm644 /tmp/notsolong.service \"\$$HOME/.config/systemd/user/notsolong.service\"; \
		systemctl --user daemon-reload; \
		systemctl --user enable --now notsolong.service; \
		systemctl --user restart notsolong.service; \
		systemctl --user status notsolong.service"

	
#
#   Helpers
#

define LOAD_ENV
if [ ! -f "$(ENV_FILE)" ]; then
  echo "ERROR: Env file '$(ENV_FILE)' not found. Use ENV=dev|prod"; 
  exit 1;
fi
echo "Loading environment from $(ENV_FILE)";
set -a;
. "$(ENV_FILE)";
set +a;
endef
export LOAD_ENV

define LOAD_ENV_PROD
if [ ! -f ".env.prod" ]; then
  echo "ERROR: Env file '.env.prod' not found."; 
  exit 1;
fi
echo "Loading environment from .env.prod";
set -a;
. ".env.prod";
set +a;
endef
export LOAD_ENV_PROD