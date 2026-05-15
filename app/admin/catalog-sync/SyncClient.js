'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { triggerSync } from './actions';

export default function SyncClient({ latestRun }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const router = useRouter();

  function handleSync() {
    setError(null);
    startTransition(async () => {
      try {
        await triggerSync();
        router.refresh();
      } catch (e) {
        setError(e.message);
      }
    });
  }

  const s = latestRun;

  return (
    <div style={{ fontFamily: 'monospace', padding: 32, maxWidth: 640 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Catalog Sync</h1>

      <button
        onClick={handleSync}
        disabled={isPending}
        style={{
          padding: '8px 20px', fontSize: 14, cursor: isPending ? 'wait' : 'pointer',
          background: '#0b0a09', color: '#fff', border: 'none', borderRadius: 4,
          marginBottom: 28, opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? 'Syncing…' : 'Trigger Sync'}
      </button>

      {error && (
        <p style={{ color: '#c0392b', marginBottom: 16, fontSize: 13 }}>{error}</p>
      )}

      {s ? (
        <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
          <tbody>
            {[
              ['Status',      s.status],
              ['Triggered by', s.triggered_by],
              ['Synced at',   s.synced_at ?? s.created_at],
              ['Total rows',  s.total_rows],
              ['Processed',   s.processed],
              ['Inserted',    s.inserted],
              ['Updated',     s.updated],
              ['Skipped',     s.skipped],
              ['Failed',      s.failed],
              ['Archived',    s.archived],
              ['Errors',      s.error_count],
            ].map(([label, val]) => (
              <tr key={label} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '6px 12px 6px 0', color: '#666', whiteSpace: 'nowrap' }}>{label}</td>
                <td style={{ padding: '6px 0', fontWeight: label === 'Status' ? 600 : 400,
                  color: label === 'Status' && s.status === 'partial' ? '#c0392b' : 'inherit' }}>
                  {String(val ?? '—')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: '#666', fontSize: 13 }}>No sync runs recorded yet.</p>
      )}

      {s?.errors?.length > 0 && (
        <details style={{ marginTop: 16 }}>
          <summary style={{ fontSize: 13, cursor: 'pointer', color: '#c0392b' }}>
            {s.errors.length} error(s)
          </summary>
          <pre style={{ fontSize: 12, background: '#fff5f5', padding: 12, borderRadius: 4, marginTop: 8, overflow: 'auto' }}>
            {JSON.stringify(s.errors, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
