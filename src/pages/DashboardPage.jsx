import { useState } from 'react';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { useTimeEntries } from '../hooks/useTimeEntries';
import ClockButtons from '../components/ClockButtons';
import TimeEntriesTable from '../components/TimeEntriesTable';
import LiveClock from '../components/LiveClock';
import AppTopbar from '../components/AppTopbar';
import AppSidebar from '../components/AppSidebar';
import InstallAppButton from '../components/InstallAppButton';
import LeaveTab from '../components/LeaveTab';
import ProfileTab from '../components/ProfileTab';
import { calcDuration } from '../utils/duration';
import { exportToXLSX } from '../utils/export';

const TABS = [
  { label: 'My Clock', icon: 'pi pi-clock', key: 'my-clock' },
  { label: 'My Leave', icon: 'pi pi-calendar', key: 'my-leave' },
  { label: 'My Profile', icon: 'pi pi-user', key: 'my-profile' },
];

export default function DashboardPage({ session, profile, onLogout }) {
  const [activeTab, setActiveTab] = useState(0);
  const { entries, openEntry, loading, clockIn, clockOut } = useTimeEntries(session.user.id, profile?.company_id);
  const completedEntries = entries.filter((e) => e.clock_out);
  const lastEntry = entries[0];
  const totalHours = completedEntries.length ? (completedEntries.reduce((sum, e) => sum + Math.max(new Date(e.clock_out) - new Date(e.clock_in), 0), 0) / 3600000).toFixed(1) : '0.0';

  const activeKey = TABS[activeTab]?.key;

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
                <p className="hero-description">Track your shift in real time, review recent attendance, and keep your day organized from one clean workspace.</p>
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
              <ClockButtons openEntry={openEntry} loading={loading} onClockIn={clockIn} onClockOut={clockOut} />
              <div className="d-flex flex-wrap gap-2">
                <Tag severity={openEntry ? 'success' : 'info'} value={openEntry ? 'Live session running' : 'No active session'} rounded />
                {profile?.company?.name ? <Tag severity="contrast" value={profile.company.name} rounded /> : null}
              </div>
              <InstallAppButton className="soft-btn hero-install-btn w-100" />
            </div>
          </div>
        </Card>

        <div className="app-workspace">
          <AppSidebar tabs={TABS} activeIndex={activeTab} onSelect={setActiveTab} />

          <div className="app-content">
            {activeKey === 'my-clock' && (
              <div className="content-grid">
                <div className="sidebar-stack">
                  <Card className="glass-card status-panel">
                    <div className="d-flex flex-column gap-3">
                      <div>
                        <h2 className="section-title">At a glance</h2>
                        <p className="section-copy">Quick context for your most recent attendance activity.</p>
                      </div>
                      <div className="status-grid">
                        <div className="status-highlight">
                          <div className="status-tile-label">Last recorded duration</div>
                          <div className="status-tile-value">{lastEntry ? calcDuration(lastEntry.clock_in, lastEntry.clock_out) : 'No activity yet'}</div>
                        </div>
                        <div className="status-tile">
                          <div className="status-tile-label">Company</div>
                          <div className="status-tile-value">{profile?.company?.name || 'Not assigned'}</div>
                        </div>
                        <div className="status-tile">
                          <div className="status-tile-label">Last login</div>
                          <div className="status-tile-value">{profile?.last_login_at ? new Date(profile.last_login_at).toLocaleString() : 'First login not recorded'}</div>
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
                    <Button label="Export XLSX" icon="pi pi-file-excel" severity="success" outlined onClick={() => exportToXLSX(entries)} disabled={entries.length === 0} />
                  </div>
                  <TimeEntriesTable entries={entries} loading={loading} />
                </Card>
              </div>
            )}

            {activeKey === 'my-leave' && <LeaveTab userId={session.user.id} companyId={profile?.company_id} />}
            {activeKey === 'my-profile' && <ProfileTab profile={profile} />}
          </div>
        </div>
      </div>
    </div>
  );
}
