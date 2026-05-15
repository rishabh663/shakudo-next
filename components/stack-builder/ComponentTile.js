import LogoImg from '@/components/shared/LogoImg';

export default function ComponentTile({ component, selected, onToggle }) {
  const { name, oneLiner, category, logo } = component;
  return (
    <div className={'tile ' + (selected ? 'selected' : '')}>
      <div className="tile-head">
        <div className="tile-logo">
          <LogoImg src={logo} name={name} imgStyle={{ maxWidth: 22, maxHeight: 22, objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="tile-name" title={name}>{name}</div>
          <div className="tile-cat">{category}</div>
        </div>
      </div>
      <div className="tile-desc">{oneLiner || ' '}</div>
      <div className="tile-foot">
        <span className="tag">v{(name.length % 3) + 1}.{name.length % 9}.{name.length % 5}</span>
        {/* TODO: re-enable when KB links are ready.
        <a className="tag" href={component.kbLink} target="_blank" rel="noreferrer">Docs</a> */}
        <div style={{ flex: 1 }}></div>
        <button className={'tile-cta ' + (selected ? 'added' : '')} onClick={() => onToggle(name)}>
          {selected ? <><span style={{ fontSize: 12 }}>✓</span> Added</> : '+ Add to Stack'}
        </button>
      </div>
      {/* last_synced_at reserved in DB schema — rendered when sync data lands */}
    </div>
  );
}
