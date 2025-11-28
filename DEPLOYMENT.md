# Deployment Guide

## Deployment Overview

### 1. Development Environment

```
+-------------------+       +-------------------+
| Frontend (Vite)   |       | Backend (Django)  |
|                   |       |                   |
| localhost:5173    | <-->  | localhost:8000    |
|                   |       | SQLite DB         |
+-------------------+       +-------------------+
```

- **Frontend**: Runs on Node.js using Vite for hot module reloading.
  - Accessible at `http://localhost:5173`.
  - Communicates with the backend API at `http://localhost:8000`.
  - Requires CORS bypass for API calls.
- **Backend**: Runs Django in a virtual environment.
  - Accessible at `http://localhost:8000`.
  - Uses SQLite as the database.

### 2. Production Environment

```
+-------------------+       +-------------------+
| Backend (Django)  |       | Database (Postgres)|
|                   |       |                   |
| localhost:1111    | <-->  | db (container)    |
| Static files      |       |                   |
| Whitenoise        |       |                   |
+-------------------+       +-------------------+
```

- **Backend**: Runs Django in a Podman container.
  - Serves prebuilt frontend files (HTML, JS, CSS) via Whitenoise.
  - Accessible at `http://localhost:1111`.
  - API is available at `/api` (no CORS issues).
  - Connects to the `db` container running Postgres.
- **Database**: Runs Postgres in a separate Podman container.
  - Accessible internally as `db`.

---

## Environment Variables and Django Settings

### Development Settings
- `.env.dev` file (loaded via `direnv` with ENV=dev):  
  - `VITE_API_BASE_URL`: `http://localhost:8000` (backend API)
- base.py + dev.py settings:
- `DATABASE_URL`: Defaults to SQLite database URL via settings.dev

### Production
- `.env.prod` file:
  - `VITE_API_BASE_URL`: `/api` (backend API).
- base.py + prod.py settings:
  - `ALLOWED_HOSTS`: Includes the server's domain
  - `HOST_PORT`: Port exposed by the backend container (default: `1111`).

---

## Deployment Steps

### 1. Build and Save Images

1. Build the container images:
   ```bash
   make podman-build
   ```
2. Save the images to a tarball:
   ```bash
   make podman-save
   ```

### 2. Ship Images to Server

1. Copy the tarball to the server:
   ```bash
   make podman-ship
   ```

### 3. Start the Application

1. On the server, start the containers:
   ```bash
   podman compose -f podman-compose.yml up -d
   ```

### 4. Optional: Systemd Automation

1. Install the systemd service remotely:
   ```bash
   make podman-systemd-remote
   ```
2. Manage the service:
   ```bash
   systemctl --user start notsolong.service
   systemctl --user stop notsolong.service
   ```

---

## Directory Structure

### Development
```
.
├── backend/            # Django project
├── frontend/           # Vite React SPA
├── .env                # Development environment variables
└── Makefile            # Build and deployment tasks
```

### Production
```
.
├── podman-compose.yml  # Service definitions
├── .env.prod           # Production environment variables
├── pgdata/             # Postgres data directory
└── dist/               # Saved container images
```

---

## Notes

- **CORS in Development**: Ensure the backend allows requests from `http://localhost:5173`.
- **Persistent Data**: The `pgdata/` directory must be backed up to preserve database state.
- **Environment Files**: Use `direnv` to manage `.env` files locally. On the server, ensure `.env.prod` is correctly configured.

---

## Detailed Deployment Process

### Deployment Steps

#### Overview Diagram

```
+-------------------+       +-------------------+       +-------------------+
| Local Machine     |       | Transfer to Server|       | Remote Server      |
|                   |       |                   |       |                   |
| make podman-build |       | make podman-ship  |       | podman-compose up |
|                   |       |                   |       |                   |
| Creates           |       | Copies tarball    |       | Extracts image    |
| localhost/        | ----> | + compose.yml     | ----> | Downloads db      |
| notsolong_web     |       | + .env.prod       |       | Ensures pgdata    |
+-------------------+       +-------------------+       +-------------------+
```

#### Step-by-Step

1. **`make podman-build`**
   - Creates the `localhost/notsolong_web` image in Podman.
   - Runs a separate build container to:
     - Build the frontend using Node.js.
     - Generate the `dist` directory with JavaScript/HTML for Django to serve.

2. **`make podman-save`**
   - Saves the `localhost/notsolong_web` image from Podman to a tarball file.

3. **`make podman-ship`**
   - Copies the tarball to the remote server.
   - Extracts the image into the server's Podman.
   - Downloads other required images (e.g., `db`).
   - Ensures the following exist in `~/notsolong_deploy/`:
     - `pgdata/` directory for the database.
     - `compose.yml` file.
     - `.env.prod` file.

4. **`make podman-systemd`**
   - Installs the systemd service on the server to manage the application lifecycle.