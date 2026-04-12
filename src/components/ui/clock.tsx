'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ClockProps {
  timezone: string
  country?: string
}

export function DigitalClock({ timezone, country }: ClockProps) {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const update = () => {
      const now = new Date()
      const t = new Intl.DateTimeFormat('es', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now)

      const d = new Intl.DateTimeFormat('es', {
        timeZone: timezone,
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      }).format(now)

      setTime(t)
      setDate(d.charAt(0).toUpperCase() + d.slice(1))
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [timezone])

  if (!mounted) return null

  return (
    <div className="flex items-center gap-3">
      {/* Clock */}
      <div className="hidden sm:flex flex-col items-end leading-none">
        <span className="font-mono text-base font-bold tabular-nums tracking-tight">
          {time}
        </span>
        <span className="text-[10px] text-muted-foreground capitalize">{date}</span>
      </div>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4 text-amber-400" />
        ) : (
          <Moon className="h-4 w-4 text-slate-600" />
        )}
      </Button>
    </div>
  )
}
