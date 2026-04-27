import { useState } from 'react'
import { Menubar } from 'primereact/menubar'
import { Button } from 'primereact/button'
import { TabMenu } from 'primereact/tabmenu'
import { Card } from 'primereact/card'
import { useTimeEntries } from '../hooks/useTimeEntries'
import ClockButtons from '../components/ClockButtons'
import TimeEntriesTable from '../components/TimeEntriesTable'
import LiveClock from '../components/LiveClock'
import AdminLogsTab from '../components/AdminLogsTab'
import MaintenanceTab from '../components/MaintenanceTab'

const TABS = [
  { label: 'My Clock', icon: 'pi pi-clock' },
  { label: 'Logs', icon: 'pi pi-list' },
  { label: 'Maintenance', icon: 'pi pi-cog' }
]

export default function AdminPage({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState(0)
  const { entries, openEntry, loading, clockIn, clockOut } = useTimeEntries(session.user.id)

  const start = (
    <span className="font-bold text-lg" style={{ color: '#a5b4fc' }}>
      <i className="pi pi-clock mr-2" />ClockApp
      <span
        className="ml-2 text-xs px-2 py-1 border-round"
        style={{ background: 'rgba(165,180,252,0.15)', color: '#a5b4fc' }}
      >
        Admin
      </span>
    </span>
  )

  const end = (
    <div className="flex align-items-center gap-3">
      <span className="text-sm text-color-secondary hidden md:block">{session.user.email}</span>
      <Button label="Sign Out" icon="pi pi-sign-out" size="small" text onClick={onLogout} />
    </div>
  )

  return (
    <div className="app-container">
      <Menubar start={start} end={end} className="app-menubar" />
      <div className="p-3 md:p-5 max-w-5xl mx-auto">
        <TabMenu model={TABS} activeIndex={activeTab} onTabChange={e => setActiveTab(e.index)} className="mb-4" />

        {activeTab === 0 && (
          <>
            <Card className="clock-card mb-4 text-center">
              <LiveClock />
              <div className="mt-4">
                <ClockButtons openEntry={openEntry} loading={loading} onClockIn={clockIn} onClockOut={clockOut} />
              </div>
            </Card>
            <Card className="logs-card">
              <h3 className="mt-0 mb-3" style={{ color: '#a5b4fc' }}>
                <i className="pi pi-list mr-2" />My Time Log
              </h3>
              <TimeEntriesTable entries={entries} loading={loading} />
            </Card>
          </>
        )}

        {activeTab === 1 && <AdminLogsTab />}
        {activeTab === 2 && <MaintenanceTab session={session} />}
      </div>
    </div>
  )
}
