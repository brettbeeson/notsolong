# Deployment (Podman Quadlets)

This repo deploys via rootless Podman + Quadlet `.container` files (systemd user services), packaged into `dist/` and installed by `deploy/install.sh`.

## Topology

```
   Host
┌───────────┐         127.0.0.1:1111         ┌──────────────────────────┐
│   Nginx   │  ───────────────────────────▶  │ notsolong-web (container)│
└───────────┘          proxy_pass            │ listens :8000            │
                                             └───────────┬──────────────┘
                                                         │
                                              Podman net: notsolong
                                                         │
                                             ┌───────────▼──────────────┐
                                             │ notsolong-db (container) │
                                             │ Postgres :5432           │
                                             └───────────┬──────────────┘
                                                         │
                                            ┌────────────▼─────────────┐
                                            │ volume: notsolong-pgdata  │
                                            └───────────────────────────┘
                                            (db-init/ mounted read-only)
```

## Deploy Flow

```
Local machine                       Server (user)
------------                       -------------
make image (optional)
make dist
   |
   |  rsync dist/  ───────────────────────────────▶  ~/deploy/notsolong/
   |                                                  |
   |                                                  | bash install.sh
   |                                                  v
   |                                         systemctl --user daemon-reload
   |                                                  |
   |                                                  v
   |                                         systemd user generators
   |                                                  |
   └──────────────────────────────────────────────────v
                                         podman run ... (notsolong-*.service)
```

## What `dist/` Contains

- Quadlets: `*.container`, `*.network`, `*.volume`
- `.env` (runtime env for containers)
- `db-init/` (mounted into Postgres init directory)
- `notsolong*.tar` image export
- `install.sh`

## Where Things Live (Server)

- Install dir: `~/deploy/notsolong/`
- Quadlets: `~/.config/containers/systemd/`
- Generated systemd units: `/run/user/$UID/systemd/generator/`

## Host Nginx

If Nginx runs on the host, the web container must publish a host port. Prefer binding to localhost:

- Quadlet: `PublishPort=127.0.0.1:1111:8000`
- Nginx: `proxy_pass http://127.0.0.1:1111;`

## Quadlet Gotchas (Quick)

- `PublishPort` must be a literal number (no `${VARS}`); otherwise the unit won’t be generated.
- `EnvironmentFile=...` is for container runtime env, not for Quadlet generator parsing.
- Postgres init scripts only run on an empty data dir; if you need a fresh init, remove the volume backing the data directory.