SHELL := /bin/bash

PODMAN ?= podman

BACKEND := backend
FRONTEND := frontend

COMPOSE_REFERENCE := localhost/notsolong_web:latest
COMPOSE := $(PODMAN) compose -p notsolong -f podman-compose.yml
EXPORT_TAR := dist/notsolong-images.tar
REMOTE_HOST := $(REMOTE_HOST)
REMOTE_USER := $(REMOTE_USER)
# This will contain compose files, .env.prod (and pgdata), and is referenced in systemd service file
REMOTE_APP_PATH := /home/$(REMOTE_USER)/notsolong-deploy
REMOTE_IMAGE_PATH := /tmp/notsolong-images.tar

.PHONY: podman-build podman-up podman-down podman-logs podman-seed run podman-ship

help:
	
	@echo "Build and deployment"
	@echo "  podman-ship        - Copy to $(REMOTE_HOST) and start service"
	@echo "Local commands:"
	@echo "  podman-build       - Build container images"
	@echo "  podman-up          - Start the Podman pod"
	@echo "  podman-down        - Stop the Podman pod"
	@echo "  podman-logs        - Tail logs from the Django container"
	@echo "  podman-seed        - Run the demo seed command inside the web container"
	@echo "Development"
	@echo "  run                - Run both backend and frontend development servers"

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

podman-ship:  podman-build
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

	