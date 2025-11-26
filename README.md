# NotSoLong – Project Scope & Technical Specification

*Last updated: {{today}}*

---

## **1. Overview**

**NotSoLong** is a mobile-friendly web app where users post short quotes (“**NoSoLongs**”) extracted from any **Title** (book, movie, podcast, speech, etc.).
Each NoSoLong is owned by a user and can be **voted up/down**.

The main UX mechanic:

* App shows **one Title at a time**
* Displays:

  * The **top-ranked NoSoLong**
  * **Three additional random NoSoLongs** for the same Title
* Users can:

  * Vote
  * Add their own NoSoLong
  * Navigate forward/back through random Titles
  * Filter Titles by **category**

This document defines the entire architecture for backend (Django + DRF + JWT) and frontend (React SPA).

---

## **2. Requirements**

### **Functional Requirements**

* Users can:

  * Register / log in
  * Create NoSoLongs
  * Vote up/down on any NoSoLong (once per Title)
  * Add new Titles
* Anyone (including anonymous) can:

  * View Titles
  * View the associated NoSoLongs
* Main screen:

  * Shows **one Title at a time**
  * Shows:

    * Top NoSoLong (highest score)
    * 3 random NoSoLongs from that Title
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
* Logger configured
* Custom User required
* Have a settings/ folder with dev, prod settings
* Use Black format via charliemarsh formatter 
* 

---

## **3. Data Models (Django ORM)**

### **User**

Use the custom `accounts.User` model: the email address is the primary key and `USERNAME_FIELD`, passwords are unchanged, and `display_name` is optional. There is no `username` column anywhere in the app.

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

### **NoSoLong**

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
| quote      | FK(NoSoLong)      | Required                  |
| user       | FK(User)          | Required                  |
| value      | SmallIntegerField | 1 = upvote, -1 = downvote |
| created_at | DateTimeField     | auto_now_add              |

**Constraint:**
`unique_together = ("quote", "user")`

---

## **4. API Specification (Django REST Framework)**

Base path: `/api/`

### **Auth (JWT)**

| Method | Endpoint                  | Notes                        |
| ------ | ------------------------- | ---------------------------- |
| POST   | `/api/auth/token/`        | Login via `{"email", "password"}` → `{access, refresh}`  |
| POST   | `/api/auth/token/refresh` | New access token             |
| POST   | `/api/auth/register/`     | Optional simple registration |

Registration accepts `{ "email", "password", "display_name"? }`; the response returns the serialized user (email + display_name) and the token pair.

---

### **Title Endpoints**

#### **1. Get random title bundle**

`GET /api/titles/random/?category=<cat>`

Returns:

```json
{
  "title": { ... },
  "top_nosolong": { ... },
  "other_nosolongs": [ ... up to 3 ... ]
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

### **NoSoLong Endpoints**

#### **1. Create NoSoLong**

`POST /api/nosolongs/` (auth)

```json
{
  "title": 2,
  "text": "There is no spoon.",
  "context": "Kitchen scene"
}
```

#### **2. Vote**

`POST /api/nosolongs/<id>/vote/` (auth)

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
      <TopNoSoLong />
      <OtherNoSoLongList />
        <NoSoLongItem />
      <AddMineButtons />
    <NavigationButtons />
  <AddNoSoLongDialog />
  <NewTitleDialog />
  <AuthDialog />
<AuthContextProvider />
```

### **UI Flow (primary screen)**

1. User sees one Title at a time:

   * Big Title
   * Top NoSoLong
   * 3 random NoSoLongs (dimmed)
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
* Adding NoSoLong failure:

  * keep text in dialog
  * toast: “Error saving your NoSoLong”
* Empty state:

  * No NoSoLongs → show “Be the first to add one”

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
from .views import TitleViewSet, NoSoLongViewSet
from django.urls import path, include

router = DefaultRouter()
router.register("titles", TitleViewSet, basename="titles")
router.register("nosolongs", NoSoLongViewSet, basename="nosolongs")

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
* All configuration via environment variables (`backend/.env.podman`)
* Configure CORS / CSRF + JWT security options for the exposed port

---

## **11. Roadmap**

### **Phase 1 (MVP)**

* Titles + NoSoLongs + votes
* Random title flow
* Auth (JWT)
* Add mine
* Category filter
* Next/back

### **Phase 2**

* Edit/delete own NoSoLongs
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
  - Copy `.env.example` → `.env` and set `DJANGO_SECRET_KEY`, database URL, etc.
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
  - Copy `.env.example` → `.env` and set `VITE_API_BASE_URL` (defaults to `http://localhost:8000/api`).
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

## **14. Podman Deployment (localhost:1111)**

These steps create a single pod that contains Postgres 18 and the Django/Gunicorn container. Whitenoise serves the pre-built React SPA, so no extra web tier is needed.

1. **Prep environment**
  - Copy `backend/.env.podman.example` → `backend/.env.podman` and update secrets, allowed hosts, and superuser credentials.
  - The SPA build expects `VITE_API_BASE_URL=/api`. The Containerfile sets this automatically, but keep that in mind if you build locally.
2. **Build & start**
  - `make podman-build` (builds the Node + Django multi-stage image, collects static files, and bakes in the SPA under `/static/`).
  - `make podman-up` (creates the pod, starts Postgres 18 + Django on port `1111`).
3. **Use the app**
  - Visit `http://localhost:1111`. API lives at `http://localhost:1111/api/` and shares the same origin as the SPA.
  - The Postgres data is stored in the named volume `notsolong-postgres-data`. Remove it to reset state: `podman volume rm notsolong-postgres-data`.
4. **Admin tasks**
  - Tail logs: `make podman-logs` (follows the `web` container).
  - Run management commands: `podman compose -f podman-compose.yml exec web python manage.py <command>`.
  - Stop everything: `make podman-down`.

Because Whitenoise is bundled inside Django, static files and the SPA are delivered directly from Gunicorn. No Nginx is required, and the only exposed port is `1111`.

### Optional: rootless systemd service

To have your user-level systemd manage the stack automatically:

1. Copy `systemd/notsolong.service` to `~/.config/systemd/user/`.
2. Run `systemctl --user daemon-reload`.
3. Enable + start it: `systemctl --user enable --now notsolong.service`.
4. View logs with `journalctl --user -u notsolong.service -f`.

The unit simply runs `podman compose up -d` on start and `podman compose down` on stop, so it stays in sync with the existing Makefile targets. No root privileges required.



