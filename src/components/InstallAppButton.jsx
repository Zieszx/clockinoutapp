import { useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

export default function InstallAppButton({ className = '', label = 'Install App' }) {
  const { canInstall, install, isIOS, isStandalone } = useInstallPrompt()
  const [showIOSHelp, setShowIOSHelp] = useState(false)

  if (isStandalone || (!canInstall && !isIOS)) {
    return null
  }

  return (
    <>
      {canInstall ? (
        <Button
          label={label}
          icon="pi pi-download"
          outlined
          className={className}
          onClick={install}
        />
      ) : (
        <Button
          label="Add to Phone"
          icon="pi pi-mobile"
          outlined
          className={className}
          onClick={() => setShowIOSHelp(true)}
        />
      )}

      <Dialog
        header="Install on iPhone or iPad"
        visible={showIOSHelp}
        onHide={() => setShowIOSHelp(false)}
        style={{ width: '420px', maxWidth: '92vw' }}
        modal
      >
        <div className="d-flex flex-column gap-3">
          <p className="text-muted-soft m-0">To install ClockApp on iOS:</p>
          <div className="install-steps">
            <div className="install-step">
              <span>1</span>
              <strong>Open the Share menu in Safari.</strong>
            </div>
            <div className="install-step">
              <span>2</span>
              <strong>Select “Add to Home Screen”.</strong>
            </div>
            <div className="install-step">
              <span>3</span>
              <strong>Confirm the app name and tap “Add”.</strong>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  )
}
