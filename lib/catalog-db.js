import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import sqlite3 from 'sqlite3';

const dataDir = path.join(process.cwd(), '.data');
const dbPath = process.env.SQLITE_DB_PATH || path.join(dataDir, 'stack-builder.sqlite');

// Slug → display label for all 38 categories
const CATEGORY_LABELS = {
  'large-language-model-llm':     'Large Language Models',
  'database':                     'Database',
  'machine-learning':             'Machine Learning',
  'data-storage':                 'Data Storage',
  'ai-agent':                     'AI Agents',
  'security':                     'Security',
  'ai-coding':                    'AI Coding',
  'distributed-computing':        'Distributed Computing',
  'monitoring':                   'Monitoring',
  'pipeline-orchestration':       'Pipeline Orchestration',
  'devops':                       'DevOps',
  'business-intelligence':        'Business Intelligence',
  'spatial-data':                 'Spatial Data',
  'language':                     'Language',
  'data-warehouse':               'Data Warehouse',
  'ide-development-environment':  'IDE / Dev Environment',
  'data-dashboard':               'Data Dashboard',
  'data-lake':                    'Data Lake',
  'version-control':              'Version Control',
  'data-platform':                'Data Platform',
  'web-framework':                'Web Framework',
  'api':                          'API',
  'workflow-automation':          'Workflow Automation',
  'data-integration':             'Data Integration',
  'data-streaming':               'Data Streaming',
  'data-catalog':                 'Data Catalog',
  'low-code-development-platform':'Low-Code Platform',
  'dbms':                         'DBMS',
  'data-transformation':          'Data Transformation',
  'model-serving':                'Model Serving',
  'static-site-generator':        'Static Site Generator',
  'data-logging':                 'Data Logging',
  'model-tracking':               'Model Tracking',
  'data-format':                  'Data Format',
  'automl':                       'AutoML',
  'data-quality':                 'Data Quality',
  'communication':                'Communication',
  'data-source':                  'Data Source',
};

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

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await openDb();
      await run(db, `PRAGMA journal_mode=WAL`);

      // stack_submissions (kept in sync with submissions-db.js)
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

      // stack_components
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

      // Seed from CSV if table is empty
      const [{ cnt }] = await all(db, `SELECT COUNT(*) as cnt FROM stack_components`);
      if (cnt === 0) await seedFromCSV(db);

      return db;
    })();
  }
  return dbPromise;
}

// ── CSV parser — handles quoted fields containing commas and newlines ──────

function parseCSV(raw) {
  const rows = [];
  const fields = [];
  let field = '';
  let inQ = false;
  let i = 0;

  // Normalise line endings
  const src = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  while (i < src.length) {
    const ch = src[i];

    if (ch === '"') {
      if (inQ && src[i + 1] === '"') {
        // Escaped quote inside quoted field
        field += '"';
        i += 2;
        continue;
      }
      inQ = !inQ;
      i++;
      continue;
    }

    if (ch === ',' && !inQ) {
      fields.push(field.trim());
      field = '';
      i++;
      continue;
    }

    if (ch === '\n' && !inQ) {
      fields.push(field.trim());
      field = '';
      if (fields.some(f => f !== '')) rows.push([...fields]);
      fields.length = 0;
      i++;
      continue;
    }

    field += ch;
    i++;
  }

  // Last field / row
  fields.push(field.trim());
  if (fields.some(f => f !== '')) rows.push([...fields]);

  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(vals =>
    Object.fromEntries(headers.map((h, idx) => [h, vals[idx] ?? '']))
  );
}

function toIso(dateStr) {
  if (!dateStr) return null;
  try { return new Date(dateStr).toISOString(); } catch { return null; }
}

async function seedFromCSV(db) {
  const csvPath = path.join(process.cwd(), 'data', 'components.csv');
  const rows = parseCSV(readFileSync(csvPath, 'utf8'));

  for (const row of rows) {
    if (!row['Name'] || !row['Slug']) continue;
    const categorySlug  = (row['Category'] || '').trim();
    const categoryLabel = CATEGORY_LABELS[categorySlug] || categorySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const archived      = row['Archived'] === 'true' ? 1 : 0;

    await run(db,
      `INSERT INTO stack_components
         (slug, name, one_liner, logo_url, category_slug, category_label,
          version, kb_url, last_synced_at, archived, legacy_cms_id, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(slug) DO UPDATE SET
         name           = excluded.name,
         one_liner      = excluded.one_liner,
         logo_url       = excluded.logo_url,
         category_slug  = excluded.category_slug,
         category_label = excluded.category_label,
         version        = excluded.version,
         kb_url         = excluded.kb_url,
         last_synced_at = excluded.last_synced_at,
         archived       = excluded.archived,
         legacy_cms_id  = excluded.legacy_cms_id,
         updated_at     = excluded.updated_at`,
      [
        row['Slug'],
        row['Name'],
        row['One-Liner'] || null,
        row['Logo'] || null,
        categorySlug,
        categoryLabel,
        row['Version'] || null,
        row['KB Overview'] || null,
        toIso(row['Updated On']),
        archived,
        row['Item ID'] || null,
        toIso(row['Created On']) || new Date().toISOString(),
        toIso(row['Updated On']) || new Date().toISOString(),
      ]
    );
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getComponents({ categorySlug, search } = {}) {
  const db = await getDb();
  let sql = `SELECT slug, name, one_liner, logo_url, category_slug, category_label,
                    version, kb_url, last_synced_at, archived
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
  // Normalise to the shape the UI expects
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
  const rows = await all(db,
    `SELECT category_slug AS id, category_label AS label, COUNT(*) AS count
     FROM stack_components
     WHERE archived = 0
     GROUP BY category_slug, category_label
     ORDER BY count DESC, label ASC`
  );
  return rows;
}
