'use client'

import { useEffect, useState } from 'react'
import { ThemeProvider } from './ThemeProvider'

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [accentColor, setAccentColor] = useState('#3c3cf6')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Fetch user profile for theme preferences
    fetch('/api/profile')
      .then((res) => res.json())
      .then((profile) => {
        if (profile.theme) setTheme(profile.theme)
        if (profile.accent_color) setAccentColor(profile.accent_color)
      })
      .catch(() => {
        // Use defaults if profile fetch fails
      })
  }, [])

  // Always wrap children in ThemeProvider, even before mounted
  // This ensures useTheme() hook is always available
  return (
    <ThemeProvider initialTheme={theme} initialAccentColor={accentColor}>
      {children}
    </ThemeProvider>
  )
}
