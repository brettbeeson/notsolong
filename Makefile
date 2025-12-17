# ?= sets if not already defined in environment
# := sets unconditionally (= alone is lazy evaluation)

SHELL := /bin/bash
# Fail on errors, undefined variables, and errors in pipelines
.SHELLFLAGS := -euo pipefail -c

PODMAN ?= podman
DIST_DIR := dist
IMAGE_REF := notsolong-web:latest
# Deploy paths
# - Local path should be absolute (avoid relying on ~ expansion).
# - Remote path can use ~ so it expands on the remote host.
DEPLOY_PATH_LOCAL ?= $(HOME)/deploy/notsolong
DEPLOY_PATH_REMOTE ?= ~/deploy/notsolong

.PHONY: run image dist deploy-remote deploy-local env-dev env-prod
.SILENT:
.ONESHELL:

help:
	## Process with sed to extract help from comments
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sed 's/:.*##/ -/' | column -t
	

#
# Development
#
dev: env-dev ## Run both backend and frontend development servers
	cd backend/ && $(MAKE) run & 
	cd frontend/ && $(MAKE) run


#
# Production 
#
image: ## Build the notsolong container image
	$(PODMAN) build \
		-t $(IMAGE_REF) \
		-f backend/Containerfile \
		--build-arg VITE_GOOGLE_CLIENT_ID="$${VITE_GOOGLE_CLIENT_ID:-}" \
		--build-arg VITE_TURNSTILE_SITE_KEY="$${VITE_TURNSTILE_SITE_KEY:-}" \
		--build-arg HOST_PORT="$${HOST_PORT:-1111}" \
		.

dist: env-prod ## Create a deployment dist/ package
	echo "*Note* - run 'make image' to build the image if necessary"
	echo "Creating deployment dist in $(DIST_DIR)/..."
	rm -rf "$(DIST_DIR)"
	mkdir -p "$(DIST_DIR)"
	echo "Copying deployment files"
	cp deploy/quadlets/* "$(DIST_DIR)/"
	cp deploy/install.sh "$(DIST_DIR)/"
	cp -L .env "$(DIST_DIR)/.env" # Copy resolved env file (dereference symlink)
	cp -r backend/db-init "$(DIST_DIR)/db-init"
	echo "Setting permissions on deployment files"
	chmod 600 "$(DIST_DIR)/.env"
	find "$(DIST_DIR)" -maxdepth 1 -type f -exec chmod 600 {} +
	chmod 700 "$(DIST_DIR)/install.sh"
	chmod -R 755 "$(DIST_DIR)/db-init/" # All db-init scripts must be readable/executable
	echo "Exporting $(IMAGE_REF) to ${DIST_DIR}/notsolong.tar"
	$(PODMAN) save --quiet -o "$(DIST_DIR)/notsolong.tar" "$(IMAGE_REF)"
	echo "Distribution package ready in $(DIST_DIR)/"


deploy-remote: env-prod dist ## Deploy the dist/ package to the remote server and install
	if [ -z "$(SSH)" ]; then \
		echo "ERROR: SSH variables must be set for remote deployment"; \
		exit 1; \
	fi
	echo "Deploying $(DIST_DIR)/ to $(SSH):$(DEPLOY_PATH_REMOTE)"
	ssh "$(SSH)" "mkdir -p $(DEPLOY_PATH_REMOTE)"
	rsync -az --progress --delete "$(DIST_DIR)/" "$(SSH):$(DEPLOY_PATH_REMOTE)/"
	ssh "$(SSH)" "set -euo pipefail; cd $(DEPLOY_PATH_REMOTE); bash ./install.sh; podman ps"
	echo "Remote deployment to $(SSH) completed."	
	echo "Consider setting 'loginctl enable-linger' on remote to allow services to run when not logged in."


deploy-local: env-prod dist ## Copy the dist/ to deploy and install to local machine
	@echo "Deploying locally to $(DEPLOY_PATH_LOCAL)"
	mkdir -p "$(DEPLOY_PATH_LOCAL)"
	rm -f "$(DEPLOY_PATH_LOCAL)/*"
	cp -r "$(DIST_DIR)"/* "$(DEPLOY_PATH_LOCAL)/"
	cp -r "$(DIST_DIR)"/.* "$(DEPLOY_PATH_LOCAL)/"
	@echo "Installing quadlets and starting services locally"
	cd "$(DEPLOY_PATH_LOCAL)"
	./install.sh 
	podman ps
	echo "Local deployment completed."

#
# Helpers
#
env-dev:
	@ENV_VAL=$$(./showenv.sh); \
	if [ "$$ENV_VAL" != "dev" ]; then \
		echo "ERROR: environment must be 'dev' (run: make setenv ENV=dev)"; \
		exit 1; \
	fi

env-prod:
	@ENV_VAL=$$(./showenv.sh); \
	if [ "$$ENV_VAL" != "prod" ]; then \
		echo "ERROR: environment must be 'prod' (run: make setenv ENV=prod)"; \
		exit 1; \
	fi
