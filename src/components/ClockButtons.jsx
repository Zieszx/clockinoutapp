import { useRef } from 'react'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { Tag } from 'primereact/tag'

export default function ClockButtons({ openEntry, loading, onClockIn, onClockOut }) {
  const toast = useRef(null)

  async function handleClockIn() {
    const { error } = await onClockIn()
    if (error) {
      toast.current.show({ severity: 'error', summary: 'Cannot Clock In', detail: error.message, life: 5000 })
    } else {
      toast.current.show({ severity: 'success', summary: 'Clocked In', detail: 'Your session has started.', life: 3000 })
    }
  }

  async function handleClockOut() {
    const { error } = await onClockOut()
    if (error) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: error.message, life: 4000 })
    } else {
      toast.current.show({ severity: 'success', summary: 'Clocked Out', detail: 'Session ended.', life: 3000 })
    }
  }

  return (
    <>
      <Toast ref={toast} />
      <div className="flex flex-column align-items-center gap-3">
        {openEntry && (
          <Tag severity="success" icon="pi pi-circle-fill" value="Session Active" className="text-sm session-pill" />
        )}
        <div className="clock-button-grid">
          <Button
            label="Clock In"
            icon="pi pi-play-circle"
            size="large"
            disabled={!!openEntry || loading}
            onClick={handleClockIn}
            className="clock-in-btn clock-action"
          />
          <Button
            label="Clock Out"
            icon="pi pi-stop-circle"
            size="large"
            severity="danger"
            disabled={!openEntry || loading}
            onClick={handleClockOut}
            className="clock-out-btn clock-action"
          />
        </div>
      </div>
    </>
  )
}
