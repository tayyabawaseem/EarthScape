# EarthScape Climate Agency — Platform Guide

This document explains what EarthScape is, who can do what inside it, every screen in the application, and how to operate the platform end-to-end. It is the companion document to the requirements PDF in this same folder.

---

## 1. What EarthScape is

EarthScape Climate Agency is a big-data climate intelligence platform. It ingests data from satellites, weather stations, and environmental sensors, stores it on an HDFS-based backbone, runs Hadoop MapReduce and machine-learning jobs against it, and surfaces anomalies, forecasts, and live signals through interactive dashboards. It is designed for analysts, scientists, and administrators inside a climate agency.

The codebase delivers:

- A polished, responsive Next.js 16 frontend (App Router, server + client components, Tailwind v4, custom animations).
- A Node.js backend exposed through Next.js Route Handlers (`app/api/*`).
- A MongoDB Atlas database for users, sources, jobs, alerts, dashboards, tickets, API keys, sensor signals, and ML model metadata.
- JWT-based authentication with HttpOnly cookies, role-based access control, and edge-runtime middleware that gates `/dashboard/*` and `/api/*`.

The only piece intentionally left out for a separate milestone is the actual ML model training notebook.

---

## 2. Getting started

### 2.1 Prerequisites

- Node.js 20 or newer (developed against Node 24.13).
- An internet connection (the backend talks to MongoDB Atlas).
- A modern browser.

### 2.2 Running the app

EarthScape now consists of two services — the Next.js app and the Python ML service. Open two terminals.

**Terminal 1 — Next.js (dashboard + REST API + MongoDB):**

```
npm install
npm run dev
```

**Terminal 2 — Python ML service (TempForecast-ARIMA, port 8000):**

```
cd ml
pip install -r requirements.txt
python server.py
```

The Next.js dev server will print a local URL (default `http://localhost:3000`). Open it in a browser. The `/dashboard/models` page shows live data from the ML service; if you skip terminal 2, that page falls back to a friendly "model service offline" banner and the rest of the platform still works.

### 2.3 First-time seed (once per fresh database)

EarthScape ships with a seeding endpoint that populates the database with realistic demo data. Trigger it once:

```
curl -X POST http://localhost:3000/api/seed
```

This inserts 7 users, 7 ingestion sources, 6 ingestion files, 7 jobs, 6 alert rules, 6 alerts, 5 tickets, 5 dashboards, 3 API keys, ~186 sensor signal readings, and 6 ML model records. It also returns the demo login credentials.

### 2.4 Demo credentials

| Role          | Email                       | Password       |
| ------------- | --------------------------- | -------------- |
| Administrator | `admin@earthscape.io`       | `Climate2026!` |
| Analyst       | `analyst@earthscape.io`     | `Climate2026!` |

You can register additional users from `/register` — newly registered users default to the **Analyst** role unless they pick another during registration.

---

## 3. Roles and authority

EarthScape uses three roles. Roles are stored on the user record and embedded in the session JWT, so they are checked both in middleware and inside individual API routes.

### 3.1 Administrator

The administrator owns the workspace. Admins manage users, data sources, infrastructure, security policies, and have full read/write access to everything an analyst can do.

What an administrator can do:

- Manage users — invite new users, change roles, suspend/reactivate accounts.
- Manage data sources — connect, pause, or remove satellite/station/sensor feeds.
- View and modify all dashboards, including ones shared by others.
- Create, pause, retry, and delete MapReduce / ML jobs.
- Create, edit, and delete alert rules and thresholds.
- Generate, rotate, and revoke API keys across the workspace.
- Configure security policies (2FA enforcement, SSO requirements, IP allowlist, audit retention).
- Read the audit log.
- Everything an analyst or read-only user can do.

### 3.2 Analyst

The analyst is the working scientist or data engineer. Analysts do the day-to-day exploration, dashboard building, and operational response.

What an analyst can do:

- Read all ingested raw data and aggregates.
- Upload new climate datasets through the ingestion page.
- Create and run MapReduce / ML inference jobs.
- Build, edit, and share dashboards.
- Create alert rules and acknowledge/resolve incoming alerts.
- Generate API keys scoped to their work.
- Submit feedback and open support tickets.
- View ML models and their predictions; cannot delete models without admin approval.

What an analyst **cannot** do:

- Invite or remove users.
- Change anyone's role.
- View the workspace-wide audit log.
- Change platform-wide security policies.

### 3.3 Read-only

Read-only is for stakeholders — leadership, partner agencies, public observers — who need visibility without operational power.

What a read-only user can do:

- View any dashboard that has been published or shared with them.
- Subscribe to alert digests for their inbox.
- View documentation.

What a read-only user **cannot** do:

- Upload data.
- Create or modify dashboards, alert rules, jobs, or sources.
- Acknowledge alerts (they only receive them).
- Create or revoke API keys.
- See users, the audit log, or security policy screens.

### 3.4 Permission matrix (at a glance)

| Capability                          | Admin | Analyst | Read-only |
| ----------------------------------- | :---: | :-----: | :-------: |
| Sign in / view dashboards           |   Y   |    Y    |     Y     |
| Submit feedback                     |   Y   |    Y    |     Y     |
| Upload data, create jobs            |   Y   |    Y    |     N     |
| Create / edit dashboards            |   Y   |    Y    |     N     |
| Acknowledge alerts                  |   Y   |    Y    |     N     |
| Manage alert rules                  |   Y   |    Y    |     N     |
| Generate / revoke own API keys      |   Y   |    Y    |     N     |
| Invite / suspend users              |   Y   |    N    |     N     |
| Change user roles                   |   Y   |    N    |     N     |
| View audit log                      |   Y   |    N    |     N     |
| Change security policies            |   Y   |    N    |     N     |
| Manage data sources                 |   Y   |    N    |     N     |

---

## 4. Pages and what each one does

The application is organized into a public landing area, an authentication area, and an authenticated dashboard. Each dashboard page below corresponds to a route under `/dashboard/*`.

### 4.1 Landing (`/`)

The public homepage. It introduces EarthScape, shows live planetary signals (temperature anomaly, CO₂ ppm, sea level, wildfire intensity, forest cover), explains the ingest → store → process → predict → visualize pipeline, and offers entry points to **Sign in** and **Get started**. Accessible without login.

### 4.2 Sign in (`/login`)

Lets a returning user sign in. The form pre-fills the demo analyst credentials; clicking **Administrator** swaps to the admin demo credentials. On success the backend sets an HttpOnly JWT cookie and redirects to `/dashboard`. If the user was redirected here from a protected page, the `?next=` query parameter sends them back to that page after login.

### 4.3 Register (`/register`)

Three-step wizard for new workspaces: Identity → Role → Workspace. On submit it calls `POST /api/auth/register`, which creates the user, hashes their password with bcrypt, and signs them in immediately. New self-registered users default to **Analyst** unless they select **Administrator**.

### 4.4 Dashboard overview (`/dashboard`)

The first screen after login. Shows four headline KPIs (global anomaly, CO₂, sea level rise, forest cover), a global temperature anomaly chart, current workspace counts (open alerts, running jobs, open tickets, active users, total dashboards), weekly ingestion volume, the latest live events, an anomaly heatmap by region and month, the live pipeline status (which stages are running and where), and a final row of system-check chips.

All data on this page is fetched live from `/api/kpis`, `/api/alerts`, `/api/jobs`, and `/api/signals`.

### 4.5 Data ingestion (`/dashboard/ingest`)

Where new data enters EarthScape. Shows three source cards (satellite imagery, weather stations, environmental sensors), an animated drag-and-drop upload zone that accepts NetCDF, HDF, GRIB2, GeoTIFF, CSV, and JSON, and a live ingestion queue table backed by `/api/ingestion/queue`. Files dropped on the zone are immediately registered in MongoDB via `POST /api/ingestion/upload` and appear in the queue. Available to analysts and admins.

### 4.6 Data processing (`/dashboard/processing`)

The MapReduce / ML job control. Shows live KPI cards (active jobs, completed today, failed today, queued) computed from MongoDB, and a real jobs table from `/api/jobs` with progress bars, status chips, and per-row pause/play controls. Analysts can spawn new jobs via the **New job** button which posts to `/api/jobs` and persists immediately.

### 4.7 ML models (`/dashboard/models`)

Live forecast view backed by the **TempForecast-XGB** model in the `ml/` folder. The page calls `/api/predict?city=<city>`, which proxies to the Python FastAPI service (`ml/server.py`) which in turn loads the joblib-pickled XGBoost bundle and produces:

- A **city picker** with all 30 trained Pakistani cities (across coastal, plains, foothills, mountains and Balochistan plateau)
- A **predicted-vs-actual chart** from the per-city held-out backtest
- A **7-day forward forecast** table + chart (recursive: predict t+1, append, predict t+2, …)
- Real accuracy numbers per city: **RMSE, MAE, MAPE, R²**, and tolerance-band accuracy (% predictions within ±1 / ±2 / ±3 / ±5 °C)
- Top feature importances from the trained model

If the ML service is not running, the page shows a "model service offline" banner with the exact command to start it. The training notebook (`ml/notebook.ipynb`) walks through the same logic with markdown explanations and matplotlib plots — this is the primary deliverable for the project report.

### 4.8 Visualizations (`/dashboard/visualizations`)

Live charts over the `signals` collection: global temperature anomaly, CO₂ ppm, and Arctic sea ice extent on the headline row; a carbon budget donut and three more metric panels below. The bottom half has a **panel builder** that picks a data source from the signals (temperature anomaly, CO₂, sea level, forest cover, wildfire index, sea ice extent), a visualisation type and time range, and saves the result via `POST /api/dashboards`. Saved dashboards are listed live from `GET /api/dashboards`.

### 4.9 Alerts and notifications (`/dashboard/alerts`)

Top counters show open / acknowledged / running rules / resolved counts. The alert feed lists items with severity (critical, high, moderate, info), each with **Acknowledge** and **Resolve** buttons that `PATCH /api/alerts`. The threshold table at the bottom (`/api/alert-rules`) supports toggling rules on/off, with full CRUD via the same endpoint. Per-user notification routing lives on the settings page instead of this one.

### 4.10 User management (`/dashboard/users`)

Admin-only screen. Role cards (admin / analyst / read-only) show live counts; the table supports role changes and suspend/activate via `PATCH /api/users`. Below that, the **Recent audit events** panel pulls live from `/api/audit-events` — every mutation across the platform (role change, alert ack, job creation, API key generation, ingestion upload) is recorded via the `recordAudit()` helper. If an analyst tries this page, the API returns 403 and the UI shows a banner asking them to sign in as admin.

### 4.11 Support and feedback (`/dashboard/support`)

Three help-channel cards, a personal tickets list from `/api/tickets`, an inline **Submit feedback** form that posts to `/api/feedback`, and an FAQ accordion. Users can open new tickets via the top-right **New ticket** button.

### 4.12 Documentation (`/docs`)

Public documentation hub: search hero, six topic cards (ingestion, processing, ML models, dashboards, alerts, security), a list of video tutorials, a preflight checklist, and a visual architecture diagram (Ingest → MongoDB → Next.js API / FastAPI → Dashboard).

### 4.13 Settings (`/dashboard/settings`)

Per-user preferences with three tabs: **Profile** (name, email, timezone — saves via `PATCH /api/settings/me`), **Notifications** (per-event × per-channel matrix; toggling any switch immediately persists to your user document), and **API keys** (live list from `/api/settings/api-keys`, with **Generate new key** that shows the secret once and **Revoke** controls).

---

## 5. API endpoints

All endpoints live under `app/api/*`. Every endpoint except the four listed as "public" requires a signed-in session cookie (set on login). Routes marked **admin** additionally check the role.

| Method | Path                          | Auth          | Purpose                                              |
| ------ | ----------------------------- | ------------- | ---------------------------------------------------- |
| POST   | `/api/auth/register`          | public        | Create user, hash password, sign session JWT         |
| POST   | `/api/auth/login`             | public        | Verify password, set session cookie                  |
| POST   | `/api/auth/logout`            | public        | Clear session cookie                                 |
| GET    | `/api/auth/me`                | any           | Return current user from session                     |
| POST   | `/api/seed`                   | public (dev)  | Populate the database with realistic demo data       |
| GET    | `/api/kpis`                   | any           | Workspace counts (alerts, jobs, tickets, users)      |
| GET    | `/api/signals`                | any           | Latest sensor readings + per-metric series           |
| GET    | `/api/sources`                | any           | List ingestion sources                               |
| GET    | `/api/ingestion/queue`        | any           | List ingestion files and progress                    |
| POST   | `/api/ingestion/upload`       | any           | Register a new file in the ingestion queue           |
| GET    | `/api/jobs`                   | any           | List jobs + summary counters                         |
| POST   | `/api/jobs`                   | any           | Create a new MapReduce / ML job                      |
| GET    | `/api/models`                 | any           | List ML models and summary stats                     |
| GET    | `/api/alerts`                 | any           | List alerts (optionally filtered by severity)        |
| PATCH  | `/api/alerts`                 | any           | Acknowledge / resolve an alert                       |
| GET    | `/api/alert-rules`            | any           | List alert rules                                     |
| POST   | `/api/alert-rules`            | any           | Create an alert rule                                 |
| PATCH  | `/api/alert-rules`            | any           | Toggle / edit an alert rule                          |
| DELETE | `/api/alert-rules?id=...`     | any           | Delete an alert rule                                 |
| GET    | `/api/users`                  | **admin**     | List all users with role counts                      |
| POST   | `/api/users`                  | **admin**     | Invite a user                                        |
| PATCH  | `/api/users`                  | **admin**     | Change a user's role or status                       |
| GET    | `/api/tickets`                | any           | List support tickets                                 |
| POST   | `/api/tickets`                | any           | Open a new support ticket                            |
| POST   | `/api/feedback`               | any           | Submit feedback (bug / idea / question)              |
| GET    | `/api/dashboards`             | any           | List saved dashboards                                |
| POST   | `/api/dashboards`             | any           | Save a new dashboard                                 |
| GET    | `/api/settings/me`            | any           | Current user profile (full record)                   |
| PATCH  | `/api/settings/me`            | any           | Update name / email / timezone                       |
| GET    | `/api/settings/api-keys`      | any           | List your API keys                                   |
| POST   | `/api/settings/api-keys`      | any           | Generate a new API key (returns the secret once)     |
| DELETE | `/api/settings/api-keys?id=…` | any           | Revoke an API key                                    |
| GET    | `/api/ingestion/by-day`       | any           | Aggregate ingest sizes by day for weekly chart       |
| GET    | `/api/audit-events`           | any           | List recent audit events (role changes, alert acks, jobs, uploads, key generation) |
| GET    | `/api/predict`                | any           | Combined model info, history, backtest, and 12-month forecast (proxies to FastAPI) |

Failed authentication returns **401**. Failed authorization (analyst trying admin route) returns **403**. Validation failures return **400** with a clear `error` message.

---

## 6. Suggested demo flow (for a project walkthrough)

1. Visit `/` and walk through the landing page (hero, signals, pipeline diagram).
2. Click **Sign in**, pick **Analyst**, sign in.
3. Land on the overview dashboard — point out the live KPIs (from `/api/signals`), the weekly ingestion chart (aggregated from `/api/ingestion/by-day`), and the live events + pipeline status panels.
4. Open **Data ingestion**, drop a sample file onto the upload zone, show the file appearing in the queue (it persisted in MongoDB) and the overview chart updating on refresh.
5. Open **Processing**, click **New job** to spawn a MapReduce-style job; show it appearing in the table.
6. Open **ML models** — point out the live RMSE, accuracy bands, and the 12-month forecast table, all served by the FastAPI ML service.
7. Open **Visualizations**, use the panel builder to save a new dashboard; show it appearing in the **Saved dashboards** list.
8. Open **Alerts**, acknowledge one alert; toggle an alert rule off and back on.
9. Open **Support**, submit a feedback form and open a new ticket; refresh to show they persist.
10. Open **Settings → Notifications** and flip a Slack toggle; refresh — it persisted to your user document.
11. Open **Settings → API keys** and generate a new key; the secret is shown once.
12. Sign out from the sidebar; sign back in as **Administrator**.
13. Open **Users** — only visible because role is admin. Change another user's role; watch the audit panel below populate with the change you just made.

This demo touches every functional requirement in the PDF and every panel on every page is backed by a real API call.

---

## 7. Technical stack

| Layer              | Choice                                       |
| ------------------ | -------------------------------------------- |
| Frontend framework | Next.js 16 (App Router, Turbopack)           |
| Language           | TypeScript                                   |
| Styling            | Tailwind CSS v4 + custom CSS animations      |
| UI components      | Hand-built, no third-party UI library        |
| Charts             | Hand-rolled SVG (no chart library)           |
| API layer          | Next.js Route Handlers (`app/api/*`)         |
| Database           | MongoDB Atlas                                |
| ODM                | Native `mongodb` driver (typed collections)  |
| Auth               | JWT (`jose`) in HttpOnly cookies             |
| Password hashing   | bcrypt (`bcryptjs`)                          |
| Validation         | Zod                                          |
| Middleware         | Edge-runtime middleware gating routes        |
| ML (next phase)    | Python + scikit-learn / PyTorch              |

---

## 8. Known limitations / what's not yet built

Every visible panel in the dashboard is now backed by a real API. Anything that would have required infrastructure we don't actually run — Hadoop cluster, Kafka stream, Prometheus metrics pipeline, real email/SMS/Slack dispatch — has been removed from the dashboard rather than faked. Specifically:

- The dedicated **HDFS storage browser**, **real-time streaming** view, and **performance monitoring** screens were intentionally cut. Their would-be data sources (HDFS, Kafka, Prometheus) aren't part of this submission and we'd rather not display fabricated numbers.
- **Notification routing** (the channel toggles on settings) persists to the user document but does not currently dispatch real email/SMS/Slack messages — that integration is the next backend milestone.
- A single forecast model (**TempForecast-XGB**, XGBoost trained on ~50 years of daily Meteostat observations across 30 Pakistani cities) is served from `ml/server.py` and powers `/dashboard/models`. The model predicts the next day's mean temperature for any chosen city and produces a 7-day forecast via recursive rollout. Natural follow-ups would be: regional/national aggregates, LSTM with exogenous humidity/pressure features, or longer forecast horizons.
- The **real-time stream** is a simulated ticker rather than a live Kafka consumer.
- The **HDFS browser** shows a representative tree; it does not run against a live Hadoop cluster.
- **File uploads** register file metadata in MongoDB but do not yet stream the raw bytes into HDFS — the storage layer would be the next backend step beyond ML.
- Notification channels (email, Slack, SMS) are toggleable in the UI but do not dispatch real messages; the dispatch worker is out of scope.

---

## 9. Where to ask for help

- **Inside the app:** `/dashboard/support` — open a ticket or submit feedback.
- **Outside the app:** the `feedback/` folder in the repo contains the requirements PDF and this guide.
