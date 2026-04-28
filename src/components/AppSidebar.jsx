export default function AppSidebar({ tabs, activeIndex, onSelect }) {
  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-header d-none d-md-flex">
        <span className="app-sidebar-kicker">Workspace</span>
        <strong className="app-sidebar-title">Navigation</strong>
        <span className="app-sidebar-copy">Move between your daily tools, reports, and admin controls.</span>
      </div>
      {tabs.map((tab, idx) => (
        <button
          key={tab.key || idx}
          className={`app-sidebar-item${activeIndex === idx ? ' active' : ''}`}
          onClick={() => onSelect(idx)}
          type="button"
        >
          <span className="app-sidebar-icon">
            <i className={tab.icon} />
          </span>
          <span className="app-sidebar-label">{tab.label}</span>
          <span className="app-sidebar-active-dot" />
        </button>
      ))}
    </aside>
  )
}
