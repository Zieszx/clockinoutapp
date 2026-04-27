import { useEffect } from 'react'
import { useSelector } from 'react-redux'

export default function ThemeSync() {
  const mode = useSelector(state => state.theme.mode)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
    localStorage.setItem('clockapp-theme', mode)
  }, [mode])

  return null
}
