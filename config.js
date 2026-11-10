/* ==========================================================================
   Configuration — loads .env once and validates the values we cannot run
   without. Fails fast with a readable message instead of a stack trace.
   ========================================================================== */

import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));

loadEnv({ path: resolve(ROOT, ".env") });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    console.error(`\n  ✗ Missing required env var: ${name}\n    Copy .env.example to .env and fill it in.\n`);
    process.exit(1);
  }
  return value;
}

const isProduction = process.env.NODE_ENV === "production";

const jwtSecret = required("JWT_SECRET", isProduction ? undefined : "crispo-dev-secret-do-not-use-in-production");

if (!isProduction && jwtSecret === "crispo-dev-secret-do-not-use-in-production") {
  console.warn("\n  ⚠ JWT_SECRET not set — using the insecure development default.\n");
}

export const config = {
  root: ROOT,
  port: Number(process.env.PORT) || 4000,
  databaseUrl: required("DATABASE_URL", "postgres://crispo:crispo@127.0.0.1:5432/crispo"),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  jwtRememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN || "7d",
  admin: {
    email: (process.env.ADMIN_EMAIL || "admin@lays.com").trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD || "admin123",
    name: process.env.ADMIN_NAME || "Factory Admin",
  },
  distDir: resolve(ROOT, process.env.DIST_DIR || "../react-project/dist"),
  uploadsDir: resolve(ROOT, "uploads"),

  /* ── API request/response logging (middleware/logger.js) ─────────────── */
  logRequests: process.env.LOG_REQUESTS !== "false",
  logBodyChars: Number(process.env.LOG_BODY_CHARS ?? 2000),
  logFile: process.env.LOG_FILE !== "false",
};
