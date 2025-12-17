SHELL := /bin/bash

.PHONY: install dev build lint clean
		


help:
	@echo "Targets:"
	@awk 'BEGIN {FS=":.*## "} /^[a-zA-Z0-9_.-]+:.*## / {printf "  %-12s %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	

install: ## Install frontend dependencies
	npm install

run: ## Run the frontend development server
	npm run dev -- --host 0.0.0.0 --port ${PORT}

build: ## Build the frontend for production
	npm run build

clean: ## Clean up node_modules
	rm -rf node_modules

chrome: ## Run a debugging instance of Chrome on port 9222
	chromium --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug &