import { mkdirSync } from 'node:fs';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import { syncCatalogFromCSV } from './catalog-sync.js';

const dataDir = path.join(process.cwd(), '.data');
const dbPath = process.env.SQLITE_DB_PATH || path.join(dataDir, 'stack-builder.sqlite');

// ── SQLite helpers ─────────────────────────────────────────────────────────

let dbPromise = null;

function openDb() {
  return new Promise((resolve, reject) => {
    mkdirSync(dataDir, { recursive: true });
    const db = new sqlite3.Database(dbPath, err => {
      if (err) return reject(err);
      resolve(db);
    });
  });
}

export function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

export function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// ── Schema init (singleton) ────────────────────────────────────────────────

async function initDb() {
  const db = await openDb();
  await run(db, `PRAGMA journal_mode=WAL`);

  await run(db, `CREATE TABLE IF NOT EXISTS stack_submissions (
    id TEXT PRIMARY KEY,
    contact_name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    stack_json TEXT NOT NULL,
    note TEXT,
    client_submitted_at TEXT,
    received_at TEXT NOT NULL,
    ack_email_status TEXT NOT NULL,
    internal_email_status TEXT NOT NULL,
    ack_email_error TEXT,
    internal_email_error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  await run(db, `CREATE TABLE IF NOT EXISTS stack_components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    one_liner TEXT,
    logo_url TEXT,
    category_slug TEXT NOT NULL DEFAULT '',
    category_label TEXT NOT NULL DEFAULT '',
    version TEXT,
    kb_url TEXT,
    last_synced_at TEXT,
    archived INTEGER NOT NULL DEFAULT 0,
    legacy_cms_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  await run(db, `CREATE INDEX IF NOT EXISTS idx_sc_category ON stack_components (category_slug)`);
  await run(db, `CREATE INDEX IF NOT EXISTS idx_sc_archived  ON stack_components (archived)`);

  await run(db, `CREATE TABLE IF NOT EXISTS catalog_sync_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    triggered_by TEXT NOT NULL DEFAULT 'manual',
    status TEXT NOT NULL DEFAULT 'ok',
    total_rows INTEGER,
    processed INTEGER,
    inserted INTEGER,
    updated INTEGER,
    skipped INTEGER,
    failed INTEGER,
    archived INTEGER,
    error_count INTEGER,
    errors_json TEXT,
    synced_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  return db;
}

export function getDb() {
  if (!dbPromise) dbPromise = initDb();
  return dbPromise;
}

// ── Seed / sync wrappers ───────────────────────────────────────────────────

/** Seeds from CSV only if stack_components is empty. */
export async function seedIfEmpty() {
  const db = await getDb();
  const [{ cnt }] = await all(db, `SELECT COUNT(*) as cnt FROM stack_components`);
  if (cnt > 0) return { seeded: false, count: cnt };
  const summary = await syncCatalogFromCSV({ db, run, all });
  return { seeded: true, ...summary };
}

/** Always re-syncs from CSV (used by the admin endpoint). */
export async function syncCatalog() {
  const db = await getDb();
  return syncCatalogFromCSV({ db, run, all });
}

/** Syncs catalog and records the run. Single entry point for manual + cron triggers. */
export async function runCatalogSync(triggeredBy = 'manual') {
  const summary = await syncCatalog();
  await recordSyncRun(summary, triggeredBy);
  return summary;
}

export async function recordSyncRun(summary, triggeredBy = 'manual') {
  const db = await getDb();
  const status = (summary.failed ?? 0) > 0 ? 'partial' : 'ok';
  await run(db,
    `INSERT INTO catalog_sync_runs
       (triggered_by, status, total_rows, processed, inserted, updated,
        skipped, failed, archived, error_count, errors_json, synced_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      triggeredBy, status,
      summary.totalRows, summary.processed, summary.inserted, summary.updated,
      summary.skipped, summary.failed, summary.archived, summary.errorCount,
      summary.errors?.length ? JSON.stringify(summary.errors) : null,
      summary.syncedAt,
    ]
  );
}

export async function getLatestSyncRun() {
  const db = await getDb();
  const rows = await all(db,
    `SELECT * FROM catalog_sync_runs ORDER BY id DESC LIMIT 1`
  );
  if (!rows.length) return null;
  const r = rows[0];
  return { ...r, errors: r.errors_json ? JSON.parse(r.errors_json) : [] };
}

// ── Read helpers ───────────────────────────────────────────────────────────

export async function getComponents({ categorySlug, search } = {}) {
  const db = await getDb();
  let sql = `SELECT slug, name, one_liner, logo_url, category_slug, category_label,
                    version, kb_url, last_synced_at
             FROM stack_components WHERE archived = 0`;
  const params = [];
  if (categorySlug && categorySlug !== 'all') {
    sql += ` AND category_slug = ?`;
    params.push(categorySlug);
  }
  if (search) {
    sql += ` AND (name LIKE ? OR one_liner LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ` ORDER BY name ASC`;
  const rows = await all(db, sql, params);
  return rows.map(r => ({
    name:          r.name,
    slug:          r.slug,
    logo:          r.logo_url,
    oneLiner:      r.one_liner,
    category:      r.category_slug,
    categoryLabel: r.category_label,
    version:       r.version,
    kbUrl:         r.kb_url,
    lastSyncedAt:  r.last_synced_at,
  }));
}

export async function getCategories() {
  const db = await getDb();
  return all(db,
    `SELECT category_slug AS id, category_label AS label, COUNT(*) AS count
     FROM stack_components WHERE archived = 0
     GROUP BY category_slug, category_label
     ORDER BY count DESC, label ASC`
  );
}
