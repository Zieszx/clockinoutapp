import { Card } from 'primereact/card'
import { Tag } from 'primereact/tag'
import { useTimeEntries } from '../hooks/useTimeEntries'
import { useCompanySettings } from '../hooks/useCompanySettings'
import ClockButtons from '../components/ClockButtons'
import TimeEntriesTable from '../components/TimeEntriesTable'
import LiveClock from '../components/LiveClock'
import AppTopbar from '../components/AppTopbar'
import { calcDuration } from '../utils/duration'

export default function DashboardPage({ session, profile, onLogout }) {
  const { entries, openEntry, loading, clockIn, clockOut } = useTimeEntries(session.user.id)
  const { settings } = useCompanySettings()
  const completedEntries = entries.filter(entry => entry.clock_out)
  const lastEntry = entries[0]
  const totalHours = completedEntries.length
    ? (completedEntries.reduce((sum, entry) => {
        const duration = new Date(entry.clock_out) - new Date(entry.clock_in)
        return sum + Math.max(duration, 0)
      }, 0) / 3600000).toFixed(1)
    : '0.0'

  return (
    <div className="app-shell">
      <AppTopbar email={session.user.email} subtitle="Attendance workspace" onLogout={onLogout} />

      <div className="surface-container content-stack">
        <Card className="glass-card hero-banner">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">
                <i className="pi pi-bolt" />
                Daily attendance
              </div>
              <div>
                <h1 className="hero-title">A faster, clearer way to manage your workday.</h1>
                <p className="hero-description">
                  Track your shift in real time, review recent attendance, and keep your day organized from one clean workspace.
                </p>
              </div>
              <div className="hero-meta">
                <div className="metric-card">
                  <div className="metric-card-label">Status</div>
                  <div className="metric-card-value">{openEntry ? 'On shift' : 'Off shift'}</div>
                  <div className="metric-card-note">{openEntry ? 'Session currently active' : 'Ready for your next clock-in'}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-card-label">Entries</div>
                  <div className="metric-card-value">{entries.length}</div>
                  <div className="metric-card-note">Logged sessions in your history</div>
                </div>
                <div className="metric-card">
                  <div className="metric-card-label">Tracked hours</div>
                  <div className="metric-card-value">{totalHours}h</div>
                  <div className="metric-card-note">Across completed sessions</div>
                </div>
              </div>
            </div>

            <div className="clock-spotlight">
              <LiveClock />
              <div className="d-flex flex-wrap gap-2">
                <Tag severity={openEntry ? 'success' : 'info'} value={openEntry ? 'Live session running' : 'No active session'} rounded />
                {settings?.company_name ? <Tag severity="contrast" value={settings.company_name} rounded /> : null}
              </div>
            </div>
          </div>
        </Card>

        <div className="content-grid">
          <div className="sidebar-stack">
            <Card className="glass-card clock-card status-panel">
              <div className="d-flex flex-column gap-4">
                <div>
                  <h2 className="section-title">Clock actions</h2>
                  <p className="section-copy">Start or end your shift with clear status feedback and location-aware validation.</p>
                </div>
                <ClockButtons
                  openEntry={openEntry}
                  loading={loading}
                  onClockIn={clockIn}
                  onClockOut={clockOut}
                />
              </div>
            </Card>

            <Card className="glass-card status-panel">
              <div className="d-flex flex-column gap-3">
                <div>
                  <h2 className="section-title">At a glance</h2>
                  <p className="section-copy">Quick context for your most recent attendance activity and workplace setup.</p>
                </div>
                <div className="status-grid">
                  <div className="status-highlight">
                    <div className="status-tile-label">Last recorded duration</div>
                    <div className="status-tile-value">{lastEntry ? calcDuration(lastEntry.clock_in, lastEntry.clock_out) : 'No activity yet'}</div>
                  </div>
                  <div className="status-tile">
                    <div className="status-tile-label">Company</div>
                    <div className="status-tile-value">{settings?.company_name || 'Not configured yet'}</div>
                  </div>
                  <div className="status-tile">
                    <div className="status-tile-label">Last login</div>
                    <div className="status-tile-value">{profile?.last_login_at ? new Date(profile.last_login_at).toLocaleString() : 'First login not recorded yet'}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="glass-card logs-card table-panel">
            <div className="table-header">
              <div className="table-header-copy">
                <h2 className="section-title">My time log</h2>
                <p className="text-muted-soft">Review your recent clock-ins, completed sessions, and working duration.</p>
              </div>
            </div>
            <TimeEntriesTable entries={entries} loading={loading} />
          </Card>
        </div>
      </div>
    </div>
  )
}
