import { useState, useEffect } from 'react'

export default function LiveClock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="text-center">
      <div
        className="text-5xl font-bold mb-1"
        style={{ color: '#a5b4fc', fontVariantNumeric: 'tabular-nums' }}
      >
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="text-color-secondary text-sm">
        {now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  )
}
