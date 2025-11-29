# NotSoLong – Project Scope & Technical Specification
{
  "title": { ... },
  "top_recap": { ... },
  "other_recaps": [ ... up to 3 ... ]
}
## **1. Overview**

**NotSoLong** is a mobile-friendly web app where users post short quotes (“**Recaps**”) extracted from any **Title** (book, movie, podcast, speech, etc.).
Each Recap is owned by a user and can be **voted up/down**.

The main UX mechanic:

* App shows **one Title at a time**
* Displays:

  * The **top-ranked Recap**
  * **Additional random Recaps** for the same Title
* Users can:

  * Vote
  * Add their own Recap
  * Navigate forward/back through random Titles
  * Filter Titles by **category**

This document defines the entire architecture for backend (Django + DRF + JWT) and frontend (React SPA).

---

## **2. Requirements**

### **Functional Requirements**

* Users can:
  * Register / log in
  * Create Recaps
  * Vote up/down on any Recap (once per Title)
  * Add new Titles
* Anyone (including anonymous) can:
  * View Titles
  * View the associated Recaps
* Main screen:

  * Shows **one Title at a time**
  * Shows:
    * Top Recap (highest score)
    * Additional random Recaps from that Title
  * Voting requires login
  * “Add mine” requires login
* Category filter (book, movie, podcast, speech, other)
* Navigation: Back / Next (or swipe gesture)

### **Non-Functional Requirements**

* Mobile-first UI
* Backend returns JSON only
* Stateless API, JWT authentication
* CORS-enabled for React
* Deployment-ready Django structure
* PostgreSQL in production, SQLite in dev
* UV, gunicorn + Nginx deployment
* Use environment variables for secrets
* Custom User required
* Have a settings/ folder with dev, prod settings
* 

---

## **3. Data Models (Django ORM)**

### **User**

Use the custom `accounts.User` model: the email address is the primary key and `USERNAME_FIELD`, passwords are unchanged, and `username` is an optional profile field.

---

### **Title**

| Field      | Type          | Notes                                          |
| ---------- | ------------- | ---------------------------------------------- |
| id         | AutoField     | PK                                             |
| name       | CharField     | Required                                       |
| category   | CharField     | Choices: `book, movie, podcast, speech, other` |
| author     | CharField     | Optional                                       |
| created_by | FK(User)      | Nullable                                       |
| created_at | DateTimeField | auto_now_add                                   |

---

### **Recap**

| Field      | Type          | Notes                       |
| ---------- | ------------- | --------------------------- |
| id         | AutoField     | PK                          |
| title      | FK(Title)     | Required                    |
| user       | FK(User)      | Required                    |
| text       | TextField     | Required                    |
| context    | CharField     | Optional (chapter/timecode) |
| score      | IntegerField  | Default = 0 (denormalised)  |
| created_at | DateTimeField | auto_now_add                |
| updated_at | DateTimeField | auto_now                    |

---

### **Vote**

| Field      | Type              | Notes                     |
| ---------- | ----------------- | ------------------------- |
| id         | AutoField         | PK                        |
| recap      | FK(Recap)      | Required                  |
| user       | FK(User)          | Required                  |
| value      | SmallIntegerField | 1 = upvote, -1 = downvote |
| created_at | DateTimeField     | auto_now_add              |

**Constraint:**
`unique_together = ("recap", "user")`

---

## **4. API Specification (Django REST Framework)**

Base path: `/api/`

### **Auth (JWT)**

| Method | Endpoint                  | Notes                        |
| ------ | ------------------------- | ---------------------------- |
| POST   | `/api/auth/token/`        | Login via `{"email", "password"}` → `{access, refresh}`  |
| POST   | `/api/auth/token/refresh` | New access token             |
| POST   | `/api/auth/register/`     | Optional simple registration |

Registration accepts `{ "email", "password", "username"? }`; the response returns the serialized user (email + username) and the token pair.

---

### **Title Endpoints**

#### **1. Get random title bundle**

`GET /api/titles/random/?category=<cat>`

Returns:

```json
{
  "title": { ... },
  "top_recap": { ... },
  "other_recaps": [ ... up to 3 ... ]
}
```

#### **2. Create new title**

`POST /api/titles/` (auth required)

Body:

```json
{
  "name": "The Matrix",
  "category": "movie",
  "author": "Wachowski"
}
```

#### **3. Get summary for a known title**

`GET /api/titles/<id>/summary/`

Same structure as `/random`.

---

### **Recap Endpoints**

#### **1. Create Recap**

`POST /api/recaps/` (auth)

```json
{
  "title": 2,
  "text": "There is no spoon.",
  "context": "Kitchen scene"
}
```

#### **2. Vote**

`POST /api/recaps/<id>/vote/` (auth)

```json
{ "value": 1 }      // upvote
{ "value": -1 }     // downvote
{ "value": 0 }      // remove vote
```

Backend updates `score` based on delta.

---

## **5. Backend Architecture**

### **Apps / Structure**

```
notsolong/
  manage.py
  notsolong/
    settings.py
    urls.py
  api/
    models.py
    serializers.py
    views.py
    urls.py
```

### **Dependencies**

```
Django
djangorestframework
djangorestframework-simplejwt
django-cors-headers
django-environ
whitenoise
psycopg2 (prod)
```

### **settings.py essentials**

Add:

```python
INSTALLED_APPS = [
  "django.contrib.admin",
  "django.contrib.auth",
  "django.contrib.contenttypes",
  "django.contrib.sessions",
  "django.contrib.messages",
  "django.contrib.staticfiles",
  "rest_framework",
  "corsheaders",
  "api",
]
```

DRF:

```python
REST_FRAMEWORK = {
  "DEFAULT_AUTHENTICATION_CLASSES": (
    "rest_framework_simplejwt.authentication.JWTAuthentication",
  )
}
```

CORS:

```python
CORS_ALLOW_ALL_ORIGINS = True
```

JWT defaults are fine.

---

## **6. Frontend Architecture (React)**

### **Framework**

* React (Vite recommended)
* axios for API calls
* React Router
* State: Context or Zustand
* Mobile-first layout

### **Key Components**

```
<App />
  <CategoryFilter />
  <TitleViewer />
    <TitleCard />
      <TopRecap />
      <OtherRecapList />
        <RecapItem />
      <AddMineButtons />
    <NavigationButtons />
  <AddRecapDialog />
  <NewTitleDialog />
  <AuthDialog />
<AuthContextProvider />
```

### **UI Flow (primary screen)**

1. User sees one Title at a time:

   * Big Title
   * Top Recap
   * 3 random Recaps (dimmed)
   * Thumbs up/down
   * “+ Add mine”
2. Forward/back buttons (or swipe)

### **Protected actions**

If user is **not logged in** and taps:

* thumb up/down
* * Add mine
* * New title

→ show AuthDialog
→ after success, re-apply intended action

---

## **7. Title-Driven Navigation Logic**

* Category filter changes → fetch new random title
* Next:

  * Push current Title ID into `historyStack`
  * Get new random Title
* Back:

  * Pop from `historyStack`
  * Load that Title via `/titles/<id>/summary/`

---

## **8. Error Handling**

* Voting failure:

  * revert optimistic score
  * toast: “Couldn’t save your vote”
* Adding Recap failure:

  * keep text in dialog
  * toast: “Error saving your Recap”
* Empty state:

  * No Recaps → show “Be the first to add one”

---

## **9. Suggested Starter Boilerplate (Backend)**

Minimal Django API starter:

### **To create project**

```
django-admin startproject notsolong
cd notsolong
python manage.py startapp api
```

### **Install**

```
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers django-environ
```

### **URLs**

`notsolong/urls.py`:

```python
from django.urls import path, include

urlpatterns = [
    path("api/", include("api.urls")),
]
```

`api/urls.py`:

```python
from rest_framework.routers import DefaultRouter
from .views import TitleViewSet, RecapViewSet
from django.urls import path, include

router = DefaultRouter()
router.register("titles", TitleViewSet, basename="titles")
router.register("recaps", RecapViewSet, basename="recaps")

urlpatterns = [
    path("", include(router.urls)),
]
```

---

## **10. Deployment Plan**

### **Local dev**

* Django: `python manage.py runserver`
* React: `npm run dev`
* `.env` for secrets

### **Production**

* Podman pod with Postgres 18 + Django/Gunicorn (bound to `localhost:1111`)
* Whitenoise serves the Vite build + Django static assets (no separate Nginx)
* All configuration lives in the repo-level `.env`
* Configure CORS / CSRF + JWT security options for the exposed port

---

## **11. Roadmap**

### **Phase 1 (MVP)**

* Titles + Recaps + votes
* Random title flow
* Auth (JWT)
* Add mine
* Category filter
* Next/back

### **Phase 2**

* Edit/delete own Recaps
* Search Titles
* Infinite feed
* Tags
* PWA



---

## **12. Summary**

NotSoLong is a lightweight Django+React project built around a unique “random title + top quote” browsing mechanic.
This spec defines all models, APIs, and UI flows needed to implement the full system.


---

## **13. Local Development Guide**

### Backend (Django + DRF)

1. **Python & env**
  - Install Python 3.13 via `uv python install 3.13` (already configured for this repo).
  - Create/update the virtualenv: `uv venv --python 3.13 .venv`.
  - Activate: `source .venv/bin/activate`.
2. **Install dependencies**
  - `cd backend`
  - `uv pip install -e .[dev]`
3. **Environment variables**
  - Copy the repo-level `.env.example` → `.env`, set `DJANGO_SECRET_KEY`, database URL, etc., then run `direnv allow` (loads `.env` automatically in every subdirectory).
  - Django settings also honor `ENV=<name>`; if set, they read `.env.<name>` first (falling back to `.env`).
4. **Run services**
  - Apply migrations: `python manage.py migrate`
  - Load demo data (optional): `python manage.py seed --force`
  - Create a user from env vars (optional): `python manage.py createuser` (reads `DJANGO_USER_*`)
  - Start API (dev settings auto-load): `python manage.py runserver`
5. **Testing & linting**
  - Run unit tests: `python -m pytest`
  - Ruff lint/format: `uv pip install ruff` already included; run `ruff check .` / `ruff format .`

### Frontend (Vite React SPA)

1. **Node**
  - Vite 7 targets Node ≥20.19. Upgrade local Node (currently 20.16) to avoid warnings during `npm run dev/build`.
2. **Install deps**
  - `cd frontend`
  - `npm install`
3. **Environment variables**
  - The frontend consumes the same root `.env` (via direnv), so once that file exists no extra `.env` files are needed inside `frontend/`.
4. **Run & build**
  - Start dev server: `npm run dev` (requires backend running with CORS enabled).
  - Build for prod: `npm run build` (warns until Node is updated, but completes).

### Project Structure Snapshot

```
notsolong/
├── backend/            # Django project (uv-managed)
│   ├── api/            # REST API app (models, serializers, viewsets)
│   ├── accounts/       # Custom user + auth endpoints
│   ├── notsolong/      # Settings package (base/dev/prod)
│   ├── manage.py
│   └── pyproject.toml
└── frontend/           # Vite React SPA (axios + Zustand)
   ├── src/
   │   ├── api/, components/, context/, hooks/, store/, types/
   │   └── App.tsx, main.tsx
   └── package.json
```

Backend and frontend communicate over the JSON API described above. JWT auth tokens are stored in localStorage on the client, and Axios automatically attaches the bearer token to protected requests.



---

## **14. Podman Build & Deployment**

Whitenoise continues to serve the compiled Vite app from within the Django container, so the only public port is the Gunicorn one (default `1111`). The Podman workflow now lives entirely in the `Makefile`.

### Environment & image naming

- Export `ENV=<name>` (for example `ENV=prod`) before running any `make podman-*` target. Compose will read `.env.<ENV>` first and fall back to `.env` if that file is missing.
- Populate `.env.<ENV>` with database credentials, `HOST_PORT`, `ALLOWED_HOSTS`, and the `VITE_*` variables needed for the SPA build. `direnv` is already configured to load whichever file matches `ENV`.
- The `web` build outputs the tag `localhost/notsolong_web:latest`. You can confirm it exists with `podman images --filter reference=localhost/notsolong_web:latest`.

### Local build, run, and maintenance

1. `make podman-build` – runs the multi-stage Containerfile, compiles the SPA, collects Django static files, and tags the result as `localhost/notsolong_web:latest`.
2. `make podman-up` – starts Postgres 18 plus the Django/Gunicorn container on `${HOST_PORT}` (defaults to `1111`).
3. Visit `http://localhost:${HOST_PORT}` (the `/api/` endpoints share the same origin).
4. Useful helpers:
   - `make podman-logs` – tails the `web` container.
   - `podman compose -f podman-compose.yml exec web python manage.py <command>` – run management commands inside the container.
   - `make podman-down` – stop and remove the pod; remove persistent data by deleting `./pgdata`.

### Exporting and shipping images

- `make podman-save` packages every image referenced by `podman compose images` into `dist/notsolong-images.tar`. Run this after `make podman-build` to capture fresh layers.
- `make podman-ship` depends on `podman-save`, then copies the tarball to `${REMOTE_HOST}` (default `notsolong.com`) and runs `podman load -i /tmp/notsolong-images.tar` remotely before restarting `systemctl --user notsolong.service`.
- Override `REMOTE_HOST`, `REMOTE_IMAGE_PATH`, or `REMOTE_DEPLOY_USER` when invoking the target if you need a different destination.
- Old dangling layers (the `<none>` entries in `podman images`) can be cleaned up with `podman image prune` once you no longer need that cache.

### Remote systemd automation

- `make podman-systemd-remote` copies `systemd/notsolong.service` to the remote host, enables linger for `${REMOTE_DEPLOY_USER}`, installs the unit under `~/.config/systemd/user/`, reloads the daemon, and enables + starts the service.
- The unit wraps `podman compose up -d`/`down` so it stays aligned with the Makefile targets. Logs remain available via `journalctl --user -u notsolong.service -f` on the remote box.

For local, user-level automation, follow the same steps but run them directly on your machine (see `make podman-systemd` for the non-SSH helper).



