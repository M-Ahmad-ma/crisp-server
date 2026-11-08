/* ==========================================================================
   Schema — every statement is idempotent so `npm run db:migrate` can be
   run any number of times.
   ========================================================================== */

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT,
  category    TEXT,
  flavor      TEXT,
  price       NUMERIC(10, 2) NOT NULL DEFAULT 0,
  weight      TEXT,
  stock       INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'active',
  description TEXT,
  image       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  department      TEXT,
  location        TEXT,
  type            TEXT,
  experience      TEXT,
  salary_min      INTEGER,
  salary_max      INTEGER,
  salary_currency TEXT NOT NULL DEFAULT 'PKR',
  status          TEXT NOT NULL DEFAULT 'open',
  openings        INTEGER NOT NULL DEFAULT 1,
  applicants      INTEGER NOT NULL DEFAULT 0,
  description     TEXT,
  requirements    JSONB NOT NULL DEFAULT '[]'::jsonb,
  posted_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  role       TEXT,
  email      TEXT,
  phone      TEXT,
  department TEXT,
  status     TEXT NOT NULL DEFAULT 'active',
  bio        TEXT,
  avatar     TEXT,
  joined_at  TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  topic      TEXT,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS applications (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  experience TEXT,
  role       TEXT,
  link       TEXT,
  cover      TEXT,
  cv_path    TEXT,
  consent    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public site content: one row per domain (site, products, flavors, about,
-- recipes, stores, contact, jobs, team), mirroring src/data/*.js exports.
CREATE TABLE IF NOT EXISTS content (
  domain     TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_team_status ON team (status);
CREATE INDEX IF NOT EXISTS idx_messages_created ON contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_created ON applications (created_at DESC);
