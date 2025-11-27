SHELL := /bin/bash

.PHONY: install dev build lint clean

help:
	@echo "Available commands:"
	@echo "  make install   - Install project dependencies"
	@echo "  make run       - Start development server"
	@echo "  make build     - Build the project for production"
	@echo "  make lint      - Run linting on the codebase"
	@echo "  make clean     - Remove node_modules directory"

install:
	npm install

run:
	npm run dev -- --host 0.0.0.0

build:
	npm run build

lint:
	npm run lint || true

clean:
	rm -rf node_modules
