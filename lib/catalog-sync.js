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

function normalizeRow(row) {
  const categorySlug  = (row['Category'] || '').trim();
  const categoryLabel = CATEGORY_LABELS[categorySlug]
    || categorySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return {
    slug:          (row['Slug'] || '').trim(),
    name:          (row['Name'] || '').trim(),
    one_liner:     (row['One-Liner'] || '').trim() || null,
    logo_url:      (row['Logo'] || '').trim() || null,
    category_slug: categorySlug,
    category_label: categoryLabel,
    version:       (row['Version'] || '').trim() || null,
    kb_url:        (row['KB Overview'] || '').trim() || null,
    last_synced_at: toIso(row['Updated On']),
    archived:      row['Archived'] === 'true' ? 1 : 0,
    legacy_cms_id: (row['Item ID'] || '').trim() || null,
    created_at:    toIso(row['Created On']) || new Date().toISOString(),
    updated_at:    toIso(row['Updated On']) || new Date().toISOString(),
  };
}

// ── Main sync function ─────────────────────────────────────────────────────

/**
 * Parses data/components.csv and upserts rows into stack_components.
 * Returns { added, updated, skipped, errors, total }.
 */
export async function syncCatalogFromCSV(db, run) {
  const csvPath = path.join(process.cwd(), 'data', 'components.csv');
  const rows = parseCSV(readFileSync(csvPath, 'utf8'));

  let added = 0, updated = 0, skipped = 0;
  const errors = [];

  for (const row of rows) {
    const norm = normalizeRow(row);
    if (!norm.name || !norm.slug) { skipped++; continue; }

    try {
      const result = await run(db,
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
          norm.slug, norm.name, norm.one_liner, norm.logo_url,
          norm.category_slug, norm.category_label, norm.version,
          norm.kb_url, norm.last_synced_at, norm.archived, norm.legacy_cms_id,
          norm.created_at, norm.updated_at,
        ]
      );
      if (result.changes === 1 && result.lastID) added++;
      else updated++;
    } catch (err) {
      errors.push({ slug: norm.slug, error: err.message });
    }
  }

  return { total: rows.length, added, updated, skipped, errors };
}
