/* ==========================================================================
   apiLogger — appends every /api request and the data the API returned to
   server/logs/access.log, so the frontend ↔ server conversation can be
   reviewed without printing anything to the terminal.

      2026-11-10 18:45:02  GET    /api/content                 → 200   45ms   26.4 kB
                           res  {"site":{"NAV":[{"to":"/flavors","label":"Flavors"},…

   • request and response bodies are truncated to LOG_BODY_CHARS and
     sensitive fields (password, token, …) are masked.
   • nothing is printed to the console.

   Disable with LOG_REQUESTS=false (or LOG_FILE=false) in .env.
   ========================================================================== */

import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { config } from "../config.js";

const SENSITIVE_KEY = /^(password|password_hash|passwordhash|token|authorization|secret|jwt)$/i;

const LOG_DIR = join(config.root, "logs");
const LOG_FILE = join(LOG_DIR, "access.log");

function serialise(body) {
  if (body === undefined || body === null) return null;
  if (typeof body === "string") return body;
  try {
    return JSON.stringify(body, (key, value) => (SENSITIVE_KEY.test(key) ? "***" : value));
  } catch {
    return "[unserialisable body]";
  }
}

function truncate(text, max) {
  if (max <= 0 || text.length <= max) return text;
  return `${text.slice(0, max)}… [truncated, ${text.length} chars total]`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} kB`;
}

function stamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function write(lines) {
  if (!config.logFile) return;

  try {
    mkdirSync(LOG_DIR, { recursive: true });
    appendFileSync(LOG_FILE, `${lines.join("\n")}\n`);
  } catch {
    /* never let logging break a request */
  }
}

export function apiLogger(req, res, next) {
  if (!config.logRequests || !req.originalUrl.startsWith("/api")) return next();

  const startedAt = process.hrtime.bigint();

  /* Capture whatever the route sends back (res.json is the API's normal
     reply path; res.send covers the rest). */
  let responseBody;
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    responseBody = body;
    return originalJson(body);
  };
  const originalSend = res.send.bind(res);
  res.send = (body) => {
    if (responseBody === undefined) responseBody = body;
    return originalSend(body);
  };

  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const status = res.statusCode;

    /* 304s carry no body to the client — don't claim otherwise. */
    const responseText = res.statusCode === 304 ? null : serialise(responseBody);
    const size = responseText ? Buffer.byteLength(responseText) : 0;

    const lines = [
      `${stamp()}  ${req.method.padEnd(6)} ${req.originalUrl.padEnd(44)} → ${status}  ${ms.toFixed(0).padStart(5)}ms  ${responseText ? formatBytes(size).padStart(8) : "-"}`,
    ];

    const requestText = serialise(req.body);
    if (requestText && requestText !== "{}") {
      lines.push(`         req  ${truncate(requestText.replace(/\n/g, "\\n"), config.logBodyChars)}`);
    }
    if (responseText) {
      lines.push(`         res  ${truncate(responseText.replace(/\n/g, "\\n"), config.logBodyChars)}`);
    }

    write(lines);
  });

  next();
}
