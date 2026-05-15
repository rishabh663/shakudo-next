import { useState } from 'react';

export default function SubmitDialog({ stack, components, onClose }) {
  const [phase, setPhase] = useState('review'); // review | sending | success | error
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');

  const items = stack.map(n => components.find(c => c.name === n)).filter(Boolean);
  const valid = name.trim() && company.trim() && /.+@.+\..+/.test(email);

  const submit = async () => {
    if (!valid) return;
    setPhase('sending');
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: { name, company, email },
          stack: items.map(i => ({ name: i.name, category: i.category })),
          note,
          submittedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Submission failed');
      setPhase('success');
    } catch (err) {
      console.error(err);
      setPhase('error');
    }
  };

  if (phase === 'error') {
    return (
      <div className="dialog-scrim" onClick={onClose}>
        <div className="dialog dialog-success" onClick={e => e.stopPropagation()}>
          <div className="glyph" style={{ background: 'var(--color-danger)' }}>✕</div>
          <h2>Something went wrong.</h2>
          <p className="lead">The submission did not go through. Please try again.</p>
          <div className="actions" style={{ justifyContent: 'center', marginTop: 18 }}>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={() => setPhase('review')}>Try again</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'success') {
    return (
      <div className="dialog-scrim" onClick={onClose}>
        <div className="dialog dialog-success" onClick={e => e.stopPropagation()}>
          <div className="glyph">✓</div>
          <h2>Your custom stack request has been received.</h2>
          <p className="lead">
            Our experts will review your requirements and get in touch with a deployment plan tailored to your goals.
          </p>
          <div className="actions" style={{ justifyContent: 'center', marginTop: 18 }}>
            <button className="btn btn-secondary" onClick={onClose}>Back to catalog</button>
            <button className="btn btn-primary" onClick={onClose}>View status <span style={{ fontFamily: 'var(--font-mono)' }}>→</span></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dialog-scrim" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <h2>Submit your stack</h2>
        <p className="lead">We'll review your selection, validate compatibility, and reply with deployment details. Mention anything not in the catalog in the note.</p>

        <div className="stack-summary">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: 'var(--color-copper-400)', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              Stack Cart ({items.length})
            </span>
          </div>
          {items.slice(0, 6).map(it => (
            <div key={it.name} className="row">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-copper-500)', flexShrink: 0 }}></span>
              <span>{it.name}</span>
              <span className="cat">{it.category}</span>
            </div>
          ))}
          {items.length > 6 && (
            <div className="row">
              <span style={{ width: 6 }}></span>
              <span style={{ color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>+ {items.length - 6} more</span>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="field-label">Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div>
            <label className="field-label">Company</label>
            <input className="input" value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp." />
          </div>
        </div>

        <label className="field-label">Email</label>
        <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@acmecorp.com" />

        <label className="field-label">
          Notes <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--color-ink-subtle)' }}>— optional</span>
        </label>
        <textarea
          className="textarea textarea-sm"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Need a component not in the catalog? Tell us. Compliance requirements (SOC2, HIPAA), target cloud, timing — anything our team should know."
        />

        <div className="next-steps">
          <div className="label">What happens next?</div>
          <div className="body">
            Once submitted, our team will review your selected components and reach out to discuss your requirements and next steps for deployment.
          </div>
        </div>

        <div className="actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid || phase === 'sending'} onClick={submit}>
            {phase === 'sending' ? 'Sending…' : <>Submit stack <span style={{ fontFamily: 'var(--font-mono)' }}>→</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}
