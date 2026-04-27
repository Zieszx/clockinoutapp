import { useState } from 'react'
import { TabMenu } from 'primereact/tabmenu'
import { Card } from 'primereact/card'
import { Tag } from 'primereact/tag'
import { useTimeEntries } from '../hooks/useTimeEntries'
import ClockButtons from '../components/ClockButtons'
import TimeEntriesTable from '../components/TimeEntriesTable'
import LiveClock from '../components/LiveClock'
import AdminLogsTab from '../components/AdminLogsTab'
import MaintenanceTab from '../components/MaintenanceTab'
import AdminUsersTab from '../components/AdminUsersTab'
import AppTopbar from '../components/AppTopbar'
import { calcDuration } from '../utils/duration'

const TABS = [
  { label: 'My Clock', icon: 'pi pi-clock' },
  { label: 'Logs', icon: 'pi pi-list' },
  { label: 'Users', icon: 'pi pi-users' },
  { label: 'Maintenance', icon: 'pi pi-cog' }
]

export default function AdminPage({ session, profile, onLogout }) {
  const [activeTab, setActiveTab] = useState(0)
  const { entries, openEntry, loading, clockIn, clockOut } = useTimeEntries(session.user.id)
  const completedEntries = entries.filter(entry => entry.clock_out)
  const latestEntry = entries[0]

  return (
    <div className="app-shell">
      <AppTopbar email={session.user.email} roleLabel="Admin" subtitle="Operations console" onLogout={onLogout} />

      <div className="surface-container content-stack">
        <Card className="glass-card hero-banner">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">
                <i className="pi pi-briefcase" />
                Admin workspace
              </div>
              <div>
                <h1 className="hero-title">Monitor attendance, exports, and office settings in one place.</h1>
                <p className="hero-description">
                  Use the admin console to manage your own shift, review workforce logs, and maintain office check-in rules.
                </p>
              </div>
              <div className="hero-meta">
                <div className="metric-card">
                  <div className="metric-card-label">My status</div>
                  <div className="metric-card-value">{openEntry ? 'Active' : 'Offline'}</div>
                  <div className="metric-card-note">{openEntry ? 'Currently clocked in' : 'Ready for check-in'}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-card-label">My entries</div>
                  <div className="metric-card-value">{entries.length}</div>
                  <div className="metric-card-note">Personal sessions tracked</div>
                </div>
                <div className="metric-card">
                  <div className="metric-card-label">Last duration</div>
                  <div className="metric-card-value">{latestEntry ? calcDuration(latestEntry.clock_in, latestEntry.clock_out) : 'No data'}</div>
                  <div className="metric-card-note">{completedEntries.length} completed shifts</div>
                </div>
              </div>
            </div>

            <div className="clock-spotlight">
              <LiveClock />
              <div className="d-flex flex-wrap gap-2">
                <Tag severity={openEntry ? 'success' : 'info'} value={openEntry ? 'Session running' : 'No active session'} rounded />
                <Tag severity="contrast" value={profile?.last_login_at ? `Last login ${new Date(profile.last_login_at).toLocaleDateString()}` : 'Admin console'} rounded />
              </div>
            </div>
          </div>
        </Card>

        <TabMenu
          model={TABS}
          activeIndex={activeTab}
          onTabChange={e => setActiveTab(e.index)}
          className="admin-tabs"
        />

        {activeTab === 0 && (
          <div className="content-grid">
            <div className="sidebar-stack">
              <Card className="glass-card clock-card status-panel">
                <div className="d-flex flex-column gap-4">
                  <div>
                    <h2 className="section-title">My shift controls</h2>
                    <p className="section-copy">Use the same attendance actions employees get, with your admin access kept separate.</p>
                  </div>
                  <ClockButtons openEntry={openEntry} loading={loading} onClockIn={clockIn} onClockOut={clockOut} />
                </div>
              </Card>

              <Card className="glass-card status-panel">
                <div className="d-flex flex-column gap-3">
                  <h2 className="section-title">Admin quick view</h2>
                  <div className="status-grid">
                    <div className="status-tile">
                      <div className="status-tile-label">Last clock-in</div>
                      <div className="status-tile-value">{latestEntry ? new Date(latestEntry.clock_in).toLocaleString() : 'No entries yet'}</div>
                    </div>
                    <div className="status-tile">
                      <div className="status-tile-label">Completed sessions</div>
                      <div className="status-tile-value">{completedEntries.length}</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="glass-card logs-card table-panel">
              <div className="table-header">
                <div className="table-header-copy">
                  <h2 className="section-title">My time log</h2>
                  <p className="text-muted-soft">Review your own attendance activity without leaving the admin console.</p>
                </div>
              </div>
              <TimeEntriesTable entries={entries} loading={loading} />
            </Card>
          </div>
        )}

        {activeTab === 1 && <AdminLogsTab />}
        {activeTab === 2 && <AdminUsersTab />}
        {activeTab === 3 && <MaintenanceTab session={session} />}
      </div>
    </div>
  )
}
