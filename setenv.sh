#!/bin/bash
set -euo pipefail

ENV=${1:-}

case "$ENV" in
  dev)
    rm -f .env
    ln -s .env.dev .env
    echo "→ development"
    ;;

  prod)
    if [ ! -f .env.prod ]; then
      echo "Error: .env.prod not found. Create from .env.example or your secret source." >&2
      exit 1
    fi
    rm -f .env
    ln -s .env.prod .env
    echo "→ production"
    ;;

  *)
    echo "Usage: $0 {dev|prod}" >&2
    exit 1
    ;;
esac
