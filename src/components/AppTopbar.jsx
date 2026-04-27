import { Menubar } from 'primereact/menubar'
import { Button } from 'primereact/button'
import { InputSwitch } from 'primereact/inputswitch'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '../store/themeSlice'

export default function AppTopbar({ email, roleLabel, subtitle, onLogout }) {
  const dispatch = useDispatch()
  const mode = useSelector(state => state.theme.mode)
  const initials = email?.slice(0, 2).toUpperCase() || 'CU'

  const start = (
    <div className="d-flex align-items-center gap-3">
      <span className="brand-mark">
        <i className="pi pi-clock text-xl" />
      </span>
      <div className="brand-copy">
        <p className="brand-title">ClockApp</p>
        <p className="brand-subtitle">{subtitle}</p>
      </div>
      {roleLabel ? (
        <span className="role-pill d-none d-md-inline-flex">
          <i className="pi pi-shield" />
          {roleLabel}
        </span>
      ) : null}
    </div>
  )

  const end = (
    <div className="d-flex align-items-center gap-3 flex-wrap justify-content-end">
      <div className="theme-switch">
        <i className={`pi ${mode === 'dark' ? 'pi-moon' : 'pi-sun'}`} />
        <InputSwitch checked={mode === 'light'} onChange={() => dispatch(toggleTheme())} />
      </div>
      <div className="user-chip d-none d-md-inline-flex">
        <span className="user-chip-avatar">{initials}</span>
        <span className="user-chip-label">
          <strong>{email}</strong>
          <span>{roleLabel || 'Employee access'}</span>
        </span>
      </div>
      <Button label="Sign Out" icon="pi pi-sign-out" size="small" text onClick={onLogout} className="soft-btn" />
    </div>
  )

  return <Menubar start={start} end={end} className="app-menubar" />
}
