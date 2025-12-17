# NotSoLong – Project Scope & Technical Specification

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

## **2. Technical Overview **

* Mobile-first UI
* Backend returns JSON only
* Stateless API, JWT authentication
* React SPA
* Deployment-ready Django structure
* PostgreSQL in production, SQLite in dev
* UV, gunicorn + Nginx deployment
* Use environment variables for secrets
* Custom User required
* Have a settings/ folder with dev, prod settings
* 



### **Production**

Served in two containers:
- Django + Gunicorn backend (with Whitenoise for static files)
- PostgreSQL database

Can be deployed in production locally or remotely.

See DEPLOYMENT.md for full deployment instructions.


