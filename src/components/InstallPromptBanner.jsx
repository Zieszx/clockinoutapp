import InstallAppButton from './InstallAppButton'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

export default function InstallPromptBanner() {
  const { canInstall, isIOS, isStandalone } = useInstallPrompt()

  if (isStandalone || (!canInstall && !isIOS)) {
    return null
  }

  return (
      <div className="install-banner d-md-none">
        <div className="install-banner-copy">
          <span className="install-banner-kicker">Install App</span>
          <strong>Save ClockApp to your phone for faster access.</strong>
          <span>{canInstall ? 'Add it to your home screen and open it like a native app.' : 'Use Safari share options to add it to your home screen.'}</span>
        </div>
      <InstallAppButton className="primary-btn install-banner-btn" label="Install" variant="button" />
    </div>
  )
}
