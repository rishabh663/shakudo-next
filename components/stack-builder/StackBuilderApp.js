'use client';
import { useState } from 'react';
import TopNav from './TopNav';
import CategorySidebar from './CategorySidebar';
import ComponentTile from './ComponentTile';
import StackTray from './StackTray';
import SubmitDialog from './SubmitDialog';

const HOW_IT_WORKS = [
  'Browse components',
  'Add to cart',
  'Submit request',
  'Get your stack',
];

function Hero() {
  return (
    <section className="hero">
      <div className="hero-grid"></div>
      <div className="hero-bg"></div>
      <div className="hero-inner page">
        <div>
          <div className="overline">The operating system for AI</div>
          <h1>
            Pick your components.<br />
            <span className="accent">We build the rest.</span>
          </h1>
          <p className="lead">
            Browse a curated catalog of enterprise-ready components, build your custom stack, and submit your requirements to the Shakudo team.
          </p>
          <div className="hero-meta">
            <span>235+ integrations</span>
            <span className="dot">·</span>
            <span>Runs in your VPC</span>
            <span className="dot">·</span>
            <span>SOC 2 · HIPAA</span>
          </div>
        </div>
        <div></div>
      </div>
    </section>
  );
}

function ProcessFlow() {
  return (
    <div className="process-band">
      <div className="page process">
        <span className="process-label">How it works</span>
        <div className="process-flow">
          {HOW_IT_WORKS.map((label, i) => (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span className="pstep">
                <span className="num">{i + 1}</span>
                <span>{label}</span>
              </span>
              {i < HOW_IT_WORKS.length - 1 && (
                <span className="parrow" aria-hidden="true">→</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StackBuilderApp({ initialComponents = [], initialCategories = [] }) {
  const [activeCat, setActiveCat] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]);
  const [submitOpen, setSubmitOpen] = useState(false);

  const toggle = name => setSelected(s => s.includes(name) ? s.filter(x => x !== name) : [...s, name]);
  const remove = name => setSelected(s => s.filter(x => x !== name));

  let shown = initialComponents;
  if (activeCat === '__selected') shown = initialComponents.filter(c => selected.includes(c.name));
  else if (activeCat !== 'all') shown = initialComponents.filter(c => c.category === activeCat);
  if (query) {
    const q = query.toLowerCase();
    shown = shown.filter(c => c.name.toLowerCase().includes(q) || c.oneLiner?.toLowerCase().includes(q));
  }

  const filterLabel =
    activeCat === 'all' ? null
    : activeCat === '__selected' ? 'In your Stack Cart'
    : initialCategories.find(c => c.id === activeCat)?.label || activeCat;

  return (
    <div className="app">
      <TopNav />

      <Hero />
      <ProcessFlow />

      <section className="builder" id="stack">
        <div className="page">
          <div className="builder-head">
            <div className="eyebrow">Stack Builder{filterLabel ? ` · ${filterLabel}` : ''}</div>
            <h2>Build your AI &amp; data platform.</h2>
            <div className="sub">
              Pick from a curated grid of enterprise-ready stack components — orchestration, observability, security, vector DBs, MLOps, and more. Click{' '}
              <strong style={{ color: 'var(--color-ink)', fontWeight: 600 }}>+ Add to Stack</strong>{' '}
              on any component, then submit your selection for the Shakudo team to deploy.
            </div>
          </div>

          <div className="builder-grid">
            <CategorySidebar
              categories={initialCategories}
              activeCat={activeCat}
              onSelect={setActiveCat}
              totalCount={initialComponents.length}
              selectedCount={selected.length}
            />

            <main className="main">
              <div className="main-bar">
                <span className="count-label">
                  {shown.length} of {initialComponents.length} components
                </span>
                <div className="grow"></div>
                <div className="search">
                  <span style={{ color: 'var(--color-ink-subtle)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>⌕</span>
                  <input
                    placeholder="Search components…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                  <span className="kbd">⌘K</span>
                </div>
              </div>

              {shown.length === 0 ? (
                <div className="components-empty">
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--color-ink)', marginBottom: 6 }}>
                    No components match.
                  </div>
                  <div style={{ fontSize: 13 }}>Try a different category or clear the search.</div>
                </div>
              ) : (
                <div className="grid">
                  {shown.map(c => (
                    <ComponentTile
                      key={c.name}
                      component={c}
                      selected={selected.includes(c.name)}
                      onToggle={toggle}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      <div style={{ height: 120 }} />

      <StackTray
        selected={selected}
        components={initialComponents}
        onRemove={remove}
        onSubmit={() => setSubmitOpen(true)}
      />

      {submitOpen && (
        <SubmitDialog
          stack={selected}
          components={initialComponents}
          onClose={() => setSubmitOpen(false)}
        />
      )}
    </div>
  );
}
