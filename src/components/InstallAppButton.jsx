import { useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

export default function InstallAppButton({ className = '', label = 'Install App', variant = 'card' }) {
  const { canInstall, install, isIOS, isStandalone } = useInstallPrompt()
  const [showGuide, setShowGuide] = useState(false)
  const isAndroid = /android/i.test(navigator.userAgent)

  if (isStandalone) {
    return null
  }

  const buttonLabel = canInstall ? label : isIOS ? 'Add to Home Screen' : 'Install App'
  const buttonIcon = canInstall ? 'pi pi-download' : 'pi pi-mobile'
  const buttonAction = canInstall ? install : () => setShowGuide(true)

  return (
    <>
      {variant === 'button' ? (
        <Button
          label={buttonLabel}
          icon={buttonIcon}
          outlined
          className={className}
          onClick={buttonAction}
        />
      ) : (
        <div className={`install-cta ${className}`.trim()}>
          <div className="install-cta-copy">
            <span className="install-cta-kicker">Install ClockApp</span>
            <strong>{canInstall ? 'Install this app directly on your device.' : isIOS ? 'Add this app to your iPhone home screen.' : 'Use the fastest install path for this browser.'}</strong>
            <span>{canInstall ? 'Launch attendance, logs, and admin tools like a native app.' : isIOS ? 'Safari requires Add to Home Screen instead of direct install.' : 'If the browser does not show a direct prompt, use the browser install option once and the app will stay on your device.'}</span>
          </div>
          <Button
            label={buttonLabel}
            icon={buttonIcon}
            className="primary-btn install-cta-btn"
            onClick={buttonAction}
          />
        </div>
      )}

      <Dialog
        header="Add to Home Screen"
        visible={showGuide}
        onHide={() => setShowGuide(false)}
        style={{ width: '420px', maxWidth: '92vw' }}
        modal
      >
        <div className="d-flex flex-column gap-3">
          <p className="text-muted-soft m-0">
            {isIOS
              ? 'On iPhone or iPad, Safari does not allow direct install from a site button.'
              : isAndroid
                ? 'If Chrome or Edge does not show the install prompt automatically, use the browser install option once.'
                : 'If your desktop browser does not show the install prompt automatically, use its install option once.'}
          </p>
          <div className="install-steps">
            {isIOS ? (
              <>
                <div className="install-step">
                  <span>1</span>
                  <strong>Tap the Share button in Safari.</strong>
                </div>
                <div className="install-step">
                  <span>2</span>
                  <strong>Select "Add to Home Screen".</strong>
                </div>
                <div className="install-step">
                  <span>3</span>
                  <strong>Tap "Add" to place ClockApp on your device.</strong>
                </div>
              </>
            ) : (
              <>
                <div className="install-step">
                  <span>1</span>
                  <strong>Open this app in Chrome or Microsoft Edge.</strong>
                </div>
                <div className="install-step">
                  <span>2</span>
                  <strong>Use the browser menu or address bar install option.</strong>
                </div>
                <div className="install-step">
                  <span>3</span>
                  <strong>Confirm the install to keep ClockApp on your device.</strong>
                </div>
              </>
            )}
          </div>
        </div>
      </Dialog>
    </>
  )
}
