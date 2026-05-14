'use client';
import { useState } from 'react';
import LogoImg from '@/components/shared/LogoImg';

const MAX_CHIPS = 5;

export default function StackTray({ selected, components, onRemove, onSubmit }) {
  const [expanded, setExpanded] = useState(false);
  const items = selected.map(n => components.find(c => c.name === n)).filter(Boolean);

  const visible = items.slice(0, MAX_CHIPS);
  const overflow = items.length - MAX_CHIPS;

  return (
    <div className="tray-dock">
      {expanded && items.length > 0 && (
        <div className="tray-panel">
          <div className="tray-panel-head">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--color-copper-400)' }}>
              Stack Cart · {items.length} component{items.length !== 1 ? 's' : ''}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(false)}>Collapse ↓</button>
          </div>
          <div className="tray-panel-grid">
            {items.map(it => (
              <div key={it.name} className="tray-panel-row">
                <div className="mini-logo">
                  <LogoImg src={it.logo} name={it.name} imgStyle={{ maxWidth: 18, maxHeight: 18, objectFit: 'contain' }} />
                </div>
                <div className="tray-panel-meta">
                  <div className="tray-panel-name">{it.name}</div>
                  <div className="tray-panel-cat">{it.category}</div>
                </div>
                <button className="x" onClick={() => onRemove(it.name)} aria-label={'Remove ' + it.name}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tray">
        <div className="tray-label">
          <span>Stack Cart</span>
          <span className="count">{items.length}</span>
        </div>

        <div className="tray-items">
          {items.length === 0 && (
            <div className="tray-empty">
              Click <strong style={{ color: 'var(--color-copper-400)', fontWeight: 600 }}>+ Add to Stack</strong> on any component to begin.
            </div>
          )}
          {visible.map(it => (
            <div key={it.name} className="tray-chip">
              <span className="mini-logo">
                <LogoImg src={it.logo} name={it.name} />
              </span>
              <span>{it.name}</span>
              <button className="x" onClick={() => onRemove(it.name)} aria-label={'Remove ' + it.name}>×</button>
            </div>
          ))}
          {overflow > 0 && (
            <span className="tray-overflow">+{overflow} more</span>
          )}
        </div>

        {items.length > 0 && (
          <button
            className="tray-expand"
            onClick={() => setExpanded(e => !e)}
            aria-label={expanded ? 'Collapse stack panel' : 'Expand stack panel'}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? '↓' : '↑'}
          </button>
        )}

        <button
          className="btn btn-primary btn-lg"
          disabled={items.length === 0}
          onClick={onSubmit}
        >
          Review &amp; Submit <span style={{ fontFamily: 'var(--font-mono)' }}>→</span>
        </button>
      </div>
    </div>
  );
}
