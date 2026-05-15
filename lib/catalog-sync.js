import { readFileSync } from 'node:fs';
import path from 'node:path';

// ── CSV parser — handles quoted fields with embedded newlines/commas ────────

function parseCSV(raw) {
  const rows = [];
  const fields = [];
  let field = '';
  let inQ = false;
  let i = 0;
  const src = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  while (i < src.length) {
    const ch = src[i];
    if (ch === '"') {
      if (inQ && src[i + 1] === '"') { field += '"'; i += 2; continue; }
      inQ = !inQ; i++; continue;
    }
    if (ch === ',' && !inQ) { fields.push(field.trim()); field = ''; i++; continue; }
    if (ch === '\n' && !inQ) {
      fields.push(field.trim()); field = '';
      if (fields.some(f => f !== '')) rows.push([...fields]);
      fields.length = 0; i++; continue;
    }
    field += ch; i++;
  }
  fields.push(field.trim());
  if (fields.some(f => f !== '')) rows.push([...fields]);

  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(vals =>
    Object.fromEntries(headers.map((h, idx) => [h, vals[idx] ?? '']))
  );
}

// ── Category label map ─────────────────────────────────────────────────────

const CATEGORY_LABELS = {
  'large-language-model-llm':      'Large Language Models',
  'database':                      'Database',
  'machine-learning':              'Machine Learning',
  'data-storage':                  'Data Storage',
  'ai-agent':                      'AI Agents',
  'security':                      'Security',
  'ai-coding':                     'AI Coding',
  'distributed-computing':         'Distributed Computing',
  'monitoring':                    'Monitoring',
  'pipeline-orchestration':        'Pipeline Orchestration',
  'devops':                        'DevOps',
  'business-intelligence':         'Business Intelligence',
  'spatial-data':                  'Spatial Data',
  'language':                      'Language',
  'data-warehouse':                'Data Warehouse',
  'ide-development-environment':   'IDE / Dev Environment',
  'data-dashboard':                'Data Dashboard',
  'data-lake':                     'Data Lake',
  'version-control':               'Version Control',
  'data-platform':                 'Data Platform',
  'web-framework':                 'Web Framework',
  'api':                           'API',
  'workflow-automation':           'Workflow Automation',
  'data-integration':              'Data Integration',
  'data-streaming':                'Data Streaming',
  'data-catalog':                  'Data Catalog',
  'low-code-development-platform': 'Low-Code Platform',
  'dbms':                          'DBMS',
  'data-transformation':           'Data Transformation',
  'model-serving':                 'Model Serving',
  'static-site-generator':         'Static Site Generator',
  'data-logging':                  'Data Logging',
  'model-tracking':                'Model Tracking',
  'data-format':                   'Data Format',
  'automl':                        'AutoML',
  'data-quality':                  'Data Quality',
  'communication':                 'Communication',
  'data-source':                   'Data Source',
};

function toIso(dateStr) {
  if (!dateStr) return null;
  try { return new Date(dateStr).toISOString(); } catch { return null; }
}

function normalizeText(value) {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
}

function normalizeRow(row) {
  const categorySlug  = normalizeText(row['Category']) || '';
  const categoryLabel = CATEGORY_LABELS[categorySlug]
    || categorySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const now = new Date().toISOString();
  return {
    slug:           normalizeText(row['Slug']) || '',
    name:           normalizeText(row['Name']) || '',
    one_liner:      normalizeText(row['One-Liner']),
    logo_url:       normalizeText(row['Logo']),
    category_slug:  categorySlug,
    category_label: categoryLabel,
    version:        normalizeText(row['Version']),
    kb_url:         normalizeText(row['KB Overview']),
    last_synced_at: toIso(row['Updated On']),
    archived:       row['Archived'] === 'true' ? 1 : 0,
    legacy_cms_id:  normalizeText(row['Item ID']),
    created_at:     toIso(row['Created On']) || now,
    updated_at:     toIso(row['Updated On']) || now,
  };
}

// ── Manifest loader — optional version overlay ─────────────────────────────

/**
 * Loads a version manifest from MANIFEST_PATH (local file) or MANIFEST_URL (remote).
 * Returns { versionMap, generatedAt, componentCount, errors }.
 * If neither env var is set, returns an empty result (no-op).
 */
async function loadManifest() {
  const result = { versionMap: new Map(), generatedAt: null, componentCount: 0, errors: [] };
  const filePath = process.env.MANIFEST_PATH;
  const url = process.env.MANIFEST_URL;
  if (!filePath && !url) return result;

  try {
    let raw;
    if (filePath) {
      raw = readFileSync(filePath, 'utf8');
    } else {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Manifest fetch failed: HTTP ${res.status}`);
      raw = await res.text();
    }
    const manifest = JSON.parse(raw);
    result.generatedAt = manifest.generatedAt ?? null;
    if (Array.isArray(manifest.components)) {
      result.componentCount = manifest.components.length;
      for (const entry of manifest.components) {
        if (entry.slug && entry.version != null) {
          result.versionMap.set(entry.slug, String(entry.version));
        }
      }
    }
  } catch (err) {
    result.errors.push(err.message);
  }

  return result;
}

// ── Main sync function ─────────────────────────────────────────────────────

/**
 * Parses data/components.csv and upserts rows into stack_components.
 * Optionally overlays versions from a manifest (MANIFEST_PATH or MANIFEST_URL env vars).
 * Returns { totalRows, processed, inserted, updated, skipped, failed, archived,
 *           errorCount, errors, syncedAt,
 *           manifestUsed, manifestGeneratedAt, manifestComponentCount,
 *           manifestMatched, manifestMissing, manifestErrors }.
 */
export async function syncCatalogFromCSV({ db, run, all }) {
  const csvPath = path.join(process.cwd(), 'data', 'components.csv');
  const rows = parseCSV(readFileSync(csvPath, 'utf8'));

  const manifest = await loadManifest();

  const summary = {
    totalRows: rows.length,
    processed: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    archived: 0,
    errorCount: 0,
    errors: [],
    syncedAt: new Date().toISOString(),
    manifestUsed: manifest.versionMap.size > 0,
    manifestGeneratedAt: manifest.generatedAt,
    manifestComponentCount: manifest.componentCount,
    manifestMatched: 0,
    manifestMissing: 0,
    manifestErrors: manifest.errors,
  };

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;

    if (!normalizeText(row['Name']) || !normalizeText(row['Slug'])) {
      summary.skipped += 1;
      summary.errors.push(`Row ${rowNumber}: missing Name or Slug`);
      continue;
    }

    const norm = normalizeRow(row);

    // manifest version overlay — takes precedence over CSV version if present
    if (manifest.versionMap.has(norm.slug)) {
      norm.version = manifest.versionMap.get(norm.slug);
      summary.manifestMatched += 1;
    }

    try {
      const existing = await all(
        db,
        'SELECT slug FROM stack_components WHERE slug = ?',
        [norm.slug]
      );

      await run(
        db,
        `INSERT INTO stack_components (
          slug, name, one_liner, logo_url, category_slug, category_label,
          version, kb_url, last_synced_at, archived, legacy_cms_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          norm.slug, norm.name, norm.one_liner, norm.logo_url,
          norm.category_slug, norm.category_label, norm.version,
          norm.kb_url, norm.last_synced_at, norm.archived, norm.legacy_cms_id,
          norm.created_at, norm.updated_at,
        ]
      );

      summary.processed += 1;
      if (existing.length === 0) summary.inserted += 1;
      else summary.updated += 1;
      if (norm.archived) summary.archived += 1;
    } catch (error) {
      summary.failed += 1;
      summary.errors.push(`Row ${rowNumber} (${norm.slug}): ${error.message}`);
    }
  }

  summary.errorCount = summary.errors.length;
  summary.manifestMissing = manifest.versionMap.size - summary.manifestMatched;
  return summary;
}
