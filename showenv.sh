#!/bin/bash
set -euo pipefail

if [ ! -L .env ] && [ ! -f .env ]; then
  echo "none"
  exit 0
fi

# If it's a symlink, report based on its target name.
if [ -L .env ]; then
  target=$(readlink .env || true)
  case "$target" in
    .env.dev) echo "dev";;
    .env.prod) echo "prod";;
    *) echo "custom";;
  esac
  exit 0
fi

# Plain file (not symlink)
# Heuristic: infer from DJANGO_SETTINGS_MODULE.
if grep -qiE '^DJANGO_SETTINGS_MODULE\s*=\s*notsolong\.settings\.dev\b' .env; then
  echo "dev"
elif grep -qiE '^DJANGO_SETTINGS_MODULE\s*=\s*notsolong\.settings\.prod\b' .env; then
  echo "prod"
else
  echo "custom"
fi
