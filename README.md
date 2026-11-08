# Crispo server

Express API (plain JavaScript, no TypeScript) that backs the React site in
`../react-project`:

- serves the **built SPA** (`react-project/dist`) with an SPA fallback — one
  port runs everything
- **PostgreSQL** persistence for the admin console (products, jobs, team)
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

---

## API

### Public

| Method | Path | Body |
|---|---|---|
| `GET` | `/api/content` | — all nine content domains (site, products, flavors, about, recipes, stores, contact, jobs, team) |
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
- `products`, `jobs`, `team` — admin CRUD (seeded from
  `react-project/src/admin/lib/mockData.js` when empty)
- `contact_messages`, `applications` — form submissions
- `content` — one jsonb row per public content domain, seeded from
  `react-project/src/data/*.js` (those files remain the source of truth;
  re-seeding never overwrites existing rows)

`npm run db:migrate` runs schema + seeds and is safe to re-run.

---

## Layout

```
server/
├── server.js            app: /api → /uploads → dist + SPA fallback → errors
├── config.js            .env loading + validation
├── db/
│   ├── pool.js          pg Pool, query(), withTransaction()
│   ├── schema.sql
│   └── migrate.js       schema + seed (imports the frontend's data modules)
├── middleware/
│   ├── auth.js          requireAuth (JWT → user lookup)
│   ├── rateLimit.js     in-memory limiter (login: 10 / 15 min / IP)
│   └── errors.js        ApiError + JSON error handler
├── lib/                 ids, scrypt passwords, JWT sign/verify
├── routes/              auth, content, collection (generic CRUD), products,
│                        jobs, team, contact, applications
└── uploads/             CV files (gitignored)
```
