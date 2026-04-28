export default function AppSidebar({ tabs, activeIndex, onSelect }) {
  return (
    <nav className="app-sidebar">
      {tabs.map((tab, idx) => (
        <button
          key={tab.key || idx}
          className={`app-sidebar-item${activeIndex === idx ? ' active' : ''}`}
          onClick={() => onSelect(idx)}
          type="button"
        >
          <i className={tab.icon} />
          <span className="app-sidebar-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
