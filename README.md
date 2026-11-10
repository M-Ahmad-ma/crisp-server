# Crispo server

Express API (plain JavaScript, no TypeScript) that backs the React site in
`../react-project`:

- serves the **built SPA** (`react-project/dist`) with an SPA fallback — one
  port runs everything
- **PostgreSQL** persistence — `products`, `jobs` and `team` are the single
  source of truth shared by the admin console and the public site
- **auth** for the admin (JWT + scrypt-hashed password)
- receives the public **contact** and **job application** forms (CV upload)
- serves the site's **content bundle** that `src/data/*.js` hydrates from at boot

---

## Quick start

```bash
# 1. PostgreSQL — any of these works:

#    a) local PostgreSQL (create the DB once)
#       sudo -u postgres createdb crispo
#       # then set DATABASE_URL in .env (user/password may differ)

#    b) Docker (recommended here; --network host avoids docker-proxy issues)
docker run -d --name crispo-pg --restart unless-stopped --network host \
  -e POSTGRES_USER=crispo -e POSTGRES_PASSWORD=crispo \
  -e POSTGRES_DB=crispo postgres:16-alpine

# 2. server
cp .env.example .env          # then edit DATABASE_URL / JWT_SECRET
npm install
npm run db:migrate            # schema + seed (idempotent, safe to re-run)

# 3. build the frontend once (the server hosts it)
cd ../react-project && npm run build && cd ../server

# 4. run
npm start                     # → http://localhost:4000
# or, during development:
npm run dev                   # node --watch
```

For frontend development with hot reload, run `npm run dev` in
`react-project` too — Vite proxies `/api` and `/uploads` to `:4000`.

### Default admin

| | |
|---|---|
| URL | `/admin/login` |
| Email | `admin@lays.com` (override: `ADMIN_EMAIL`) |
| Password | `admin123` (override: `ADMIN_PASSWORD`) |

Seeded only when the `users` table is empty; stored as a scrypt hash.

---

## Environment (`.env`)

| Variable | Default | |
|---|---|---|
| `PORT` | `4000` | |
| `DATABASE_URL` | `postgres://crispo:crispo@127.0.0.1:5432/crispo` | |
| `JWT_SECRET` | dev fallback (warns) | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` / `JWT_REMEMBER_EXPIRES_IN` | `1d` / `7d` | login "Remember me" picks 7d |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | `admin@lays.com` / `admin123` / `Factory Admin` | seed only |
| `DIST_DIR` | `../react-project/dist` | built site to serve |
| `LOG_REQUESTS` | `true` | write every `/api` request + response to the log file |
| `LOG_BODY_CHARS` | `2000` | max body characters per log line (`0` = no bodies) |
| `LOG_FILE` | `true` | write to `logs/access.log` (nothing goes to the console) |

---

## API

### Public

| Method | Path | Body |
|---|---|---|
| `GET` | `/api/content` | — all nine content domains (site, products, flavors, about, recipes, stores, contact, jobs, team). `products`, `jobs` and `team` are composed live from the admin tables |
| `GET` | `/api/content/:domain` | — one domain |
| `POST` | `/api/auth/login` | `{email, password, remember}` → `{token, user}` |
| `POST` | `/api/contact` | `{name, email, topic, message}` |
| `POST` | `/api/applications` | multipart: `name, email, phone, experience, role, link, cover, consent, cv` (pdf/doc/docx ≤ 5 MB) |
| `GET` | `/uploads/:file` | uploaded CVs |
| `GET` | `/health` | liveness |

### Admin — `Authorization: Bearer <token>`

| Method | Path |
|---|---|
| `GET` | `/api/auth/me` |
| `GET/POST` | `/api/products` · `/api/jobs` · `/api/team` |
| `GET/PUT/DELETE` | `/api/products/:id` · `/api/jobs/:id` · `/api/team/:id` |
| `GET` | `/api/contact/messages` |
| `GET` | `/api/applications/list` |

Errors always answer `{ "error": "human readable message" }` with an
appropriate status (400 validation, 401 auth, 404 missing, 429 rate-limited,
500 unexpected).

---

## Database

`db/schema.sql` — idempotent `CREATE TABLE IF NOT EXISTS`:

- `users` — admin login
- `products`, `jobs`, `team` — **the single source of truth**. The admin
  console edits these rows; `GET /api/content` composes the public site's
  `products`, `jobs` and `team` domains from them. An edit in the admin is
  live on the public pages immediately (no second copy). Seeded from
  `seed/admin.js` when the table is empty; rows the first release shipped
  as demo data (`p_1`/`j_1`/`t_1` style ids) are replaced automatically.
- `contact_messages`, `applications` — form submissions
- `content` — page copy **without** an admin CRUD screen (navigation,
  recipes, stores, contact copy, careers intro, founder fallback), one jsonb
  row per domain, seeded from `seed/content.js`. The frontend holds no
  static copy — it fetches `GET /api/content` at boot. Re-seeding **adds any
  keys the row is missing** but never overwrites keys that already exist.

The public shapes are composed from normalised columns:

- products → `CATEGORIES` + `PRODUCTS` (`status = 'active'`; category ids
  are slugified labels, e.g. `Cheesy`)
- jobs → `JOBS` + `JOB_DEPARTMENTS` (`status = 'open'`; public slug stored
  on the row, so links stay stable when a title is edited)
- team → `TEAM` (active non-owner rows) + `OWNER` (the row flagged
  `is_owner`, with its quote and credentials)

`npm run db:migrate` runs schema + seeds and is safe to re-run. The seed
files live inside `server/`, so the API can be migrated on its own — no
frontend build or source needed.

---

## Request/response logs

Every `/api` call is appended to **`logs/access.log`** (nothing is printed
to the console), including the data the API returned:

```
2026-11-10 05:18:15  GET    /api/content          → 200    10ms   18.0 kB
         res  {"site":{"NAV":[{"to":"/flavors","label":"Flavors"},…
2026-11-10 05:18:15  POST   /api/auth/login       → 200    69ms    105 B
         req  {"email":"admin@lays.com","password":"***"}
         res  {"token":"***","user":{"id":"u_mw7v8skw",…}}
```

- `req` / `res` lines show the JSON bodies (truncated to `LOG_BODY_CHARS`,
  with passwords and tokens masked)
- static assets and non-API paths are not logged
- tune it in `.env`: `LOG_REQUESTS=false` disables logging,
  `LOG_BODY_CHARS=0` hides bodies, `LOG_FILE=false` stops writing the file

`npm run db:migrate` still prints its progress in the terminal (that is
command output, not request logging).

---

## Layout

```
server/
├── server.js            app: /api → /uploads → dist + SPA fallback → errors
├── config.js            .env loading + validation
├── db/
│   ├── pool.js          pg Pool, query(), withTransaction()
│   ├── schema.sql
│   └── migrate.js       schema + seed (reads ./seed/*)
├── seed/
│   ├── content.js       the nine public-content domains (jsonb documents)
│   └── admin.js         initial products / jobs / team rows
├── middleware/
│   ├── auth.js          requireAuth (JWT → user lookup)
│   ├── rateLimit.js     in-memory limiter (login: 10 / 15 min / IP)
│   ├── logger.js        request/response logs → logs/access.log
│   └── errors.js        ApiError + JSON error handler
├── lib/                 ids, scrypt passwords, JWT sign/verify
├── routes/              auth, content, collection (generic CRUD), products,
│                        jobs, team, contact, applications
├── logs/access.log      API request/response log (gitignored)
└── uploads/             CV files (gitignored)
```
