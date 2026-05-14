export default function CategorySidebar({ categories, activeCat, onSelect, totalCount, selectedCount }) {
  return (
    <aside className="sidebar">
      <div className={'cat-item ' + (activeCat === 'all' ? 'active' : '')} onClick={() => onSelect('all')}>
        <span>All components</span>
        <span className="count">{totalCount}</span>
      </div>
      <div className={'cat-item ' + (activeCat === '__selected' ? 'active' : '')} onClick={() => onSelect('__selected')}>
        <span style={{ color: activeCat === '__selected' ? 'var(--color-copper-400)' : undefined }}>In your Stack Cart</span>
        <span className="count">{selectedCount}</span>
      </div>
      <div className="sidebar-section">Categories</div>
      {categories.map(c => (
        <div key={c.id} className={'cat-item ' + (activeCat === c.id ? 'active' : '')} onClick={() => onSelect(c.id)}>
          <span>{c.label}</span>
          <span className="count">{c.count}</span>
        </div>
      ))}
      <div className="sidebar-section">Discover</div>
      <div className="cat-item"><span>Reference stacks</span></div>
      <div className="cat-item"><span>Use cases</span></div>
      <div className="cat-item"><span>Partner tools</span></div>
    </aside>
  );
}
