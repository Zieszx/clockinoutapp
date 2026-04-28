import { useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

export default function InstallPromptBanner() {
  const { canInstall, install, isIOS, isStandalone } = useInstallPrompt()
  const [showIOSHelp, setShowIOSHelp] = useState(false)

  if (isStandalone || (!canInstall && !isIOS)) {
    return null
  }

  return (
    <>
      <div className="install-banner d-md-none">
        <div className="install-banner-copy">
          <span className="install-banner-kicker">Install App</span>
          <strong>Save ClockApp to your phone for faster access.</strong>
          <span>{canInstall ? 'Add it to your home screen and open it like a native app.' : 'Use Safari share options to add it to your home screen.'}</span>
        </div>
        {canInstall ? (
          <Button label="Install" icon="pi pi-download" className="primary-btn install-banner-btn" onClick={install} />
        ) : (
          <Button label="How to Install" icon="pi pi-mobile" className="primary-btn install-banner-btn" onClick={() => setShowIOSHelp(true)} />
        )}
      </div>

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
