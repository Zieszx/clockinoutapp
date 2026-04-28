import { useMemo, useState } from 'react';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { useTimeEntries } from '../hooks/useTimeEntries';
import ClockButtons from '../components/ClockButtons';
import TimeEntriesTable from '../components/TimeEntriesTable';
import LiveClock from '../components/LiveClock';
import AdminLogsTab from '../components/AdminLogsTab';
import MaintenanceTab from '../components/MaintenanceTab';
import AdminUsersTab from '../components/AdminUsersTab';
import AllUsersTab from '../components/AllUsersTab';
import CompaniesTab from '../components/CompaniesTab';
import LeaveTab from '../components/LeaveTab';
import ProfileTab from '../components/ProfileTab';
import AppTopbar from '../components/AppTopbar';
import AppSidebar from '../components/AppSidebar';
import { calcDuration } from '../utils/duration';

export default function AdminPage({ session, profile, onLogout }) {
  const [activeTab, setActiveTab] = useState(0);
  const { entries, openEntry, loading, clockIn, clockOut } = useTimeEntries(session.user.id, profile?.company_id);
  const roles = profile?.roles || [];
  const isSuperAdmin = roles.includes('super_admin');
  const isAdmin = roles.includes('admin') || isSuperAdmin;

  const tabs = useMemo(() => {
    const t = [
      { label: 'My Clock', icon: 'pi pi-clock', key: 'my-clock' },
      { label: 'My Logs', icon: 'pi pi-list', key: 'my-logs' },
      { label: 'My Leave', icon: 'pi pi-calendar', key: 'my-leave' },
      { label: 'My Profile', icon: 'pi pi-user', key: 'my-profile' },
    ];
    if (isAdmin) {
      t.push({ label: 'Team Logs', icon: 'pi pi-chart-bar', key: 'team-logs' });
      t.push({ label: 'Team Users', icon: 'pi pi-users', key: 'team-users' });
      t.push({ label: 'Maintenance', icon: 'pi pi-cog', key: 'maintenance' });
    }
    if (isSuperAdmin) {
      t.push({ label: 'Companies', icon: 'pi pi-building', key: 'companies' });
      t.push({ label: 'All Users', icon: 'pi pi-globe', key: 'all-users' });
    }
    return t;
  }, [isAdmin, isSuperAdmin]);

  const activeKey = tabs[activeTab]?.key;
  const latestEntry = entries[0];
  const completedEntries = entries.filter((e) => e.clock_out);
  const roleLabel = isSuperAdmin ? 'Super Admin' : 'Admin';

  return (
    <div className="app-shell">
      <AppTopbar email={session.user.email} roleLabel={roleLabel} subtitle="Operations console" onLogout={onLogout} />

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
                <p className="hero-description">Use the admin console to manage your own shift, review workforce logs, and maintain office check-in rules.</p>
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
                {profile?.company?.name ? <Tag severity="contrast" value={profile.company.name} rounded /> : null}
              </div>
            </div>
          </div>
        </Card>

        <div className="app-workspace">
          <AppSidebar tabs={tabs} activeIndex={activeTab} onSelect={setActiveTab} />

          <div className="app-content">
            {activeKey === 'my-clock' && (
              <div className="content-grid">
                <div className="sidebar-stack">
                  <Card className="glass-card clock-card status-panel">
                    <div className="d-flex flex-column gap-4">
                      <div>
                        <h2 className="section-title">My shift controls</h2>
                        <p className="section-copy">Manage your own attendance alongside your admin duties.</p>
                      </div>
                      <ClockButtons openEntry={openEntry} loading={loading} onClockIn={clockIn} onClockOut={clockOut} />
                    </div>
                  </Card>

                  <Card className="glass-card status-panel">
                    <div className="d-flex flex-column gap-3">
                      <h2 className="section-title">Quick view</h2>
                      <div className="status-grid">
                        <div className="status-tile">
                          <div className="status-tile-label">Company</div>
                          <div className="status-tile-value">{profile?.company?.name || 'Not assigned'}</div>
                        </div>
                        <div className="status-tile">
                          <div className="status-tile-label">Last clock-in</div>
                          <div className="status-tile-value">{latestEntry ? new Date(latestEntry.clock_in).toLocaleString() : 'No entries yet'}</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="glass-card logs-card table-panel">
                  <div className="table-header">
                    <div className="table-header-copy">
                      <h2 className="section-title">My time log</h2>
                      <p className="text-muted-soft">Review your own attendance without leaving the console.</p>
                    </div>
                  </div>
                  <TimeEntriesTable entries={entries} loading={loading} />
                </Card>
              </div>
            )}

            {activeKey === 'my-logs' && (
              <Card className="glass-card logs-card">
                <div className="table-header">
                  <div className="table-header-copy">
                    <h2 className="section-title">My time log</h2>
                    <p className="text-muted-soft">Complete history of your clock-ins and outs.</p>
                  </div>
                </div>
                <TimeEntriesTable entries={entries} loading={loading} />
              </Card>
            )}

            {activeKey === 'my-leave' && <LeaveTab userId={session.user.id} companyId={profile?.company_id} />}
            {activeKey === 'my-profile' && <ProfileTab profile={profile} />}
            {activeKey === 'team-logs' && <AdminLogsTab companyId={profile?.company_id} />}
            {activeKey === 'team-users' && <AdminUsersTab profile={profile} />}
            {activeKey === 'maintenance' && <MaintenanceTab profile={profile} />}
            {activeKey === 'companies' && <CompaniesTab session={session} />}
            {activeKey === 'all-users' && <AllUsersTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
