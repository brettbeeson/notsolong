#!/bin/bash
set -euo pipefail




# Installs tar'd image and quadlet units for rootless podman.
# Assumes .env is already set up in the current directory.

# Work from the script's directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Check there is a .env file and load it.

if [ ! -f .env ]; then
  echo "Error: .env file not found in $(pwd). Please set up .env before running install.sh." >&2
  exit 1
fi
echo "Loading environment variables from .env..."
set -a
. ./.env
set +a

echo "Load the image into rootless podman..."
podman load --quiet --input notsolong.tar

echo "Installing notsolong quadlet units for rootless podman..."
SYSTEMD_QUADLET_DIR="$HOME/.config/containers/systemd"
mkdir -p "$SYSTEMD_QUADLET_DIR"
cp  *.{container,volume} "$SYSTEMD_QUADLET_DIR/"

# echo "Installing runtime env file to ~/deploy/notsolong/.env..."
# APP_DIR="$HOME/deploy/notsolong"
# mkdir -p "$APP_DIR"
# cp ./.env "$APP_DIR/.env"
# chmod 600 "$APP_DIR/.env"

# echo "Installing Postgres init scripts to ~/deploy/notsolong/db-init/..."
# mkdir -p "$APP_DIR/db-init"
# cp -r ./db-init/* "$APP_DIR/db-init/"
# chmod -R a+rX "$APP_DIR/db-init"

# Check if network exists, create if needed
if ! podman network exists notsolong 2>/dev/null; then
    echo "Creating notsolong network..."
    podman network create notsolong
else
    echo "Network notsolong already exists"
fi

systemctl --user daemon-reload
systemctl --user restart notsolong-db.service 
systemctl --user restart notsolong-web.service

podman ps | grep notsolong