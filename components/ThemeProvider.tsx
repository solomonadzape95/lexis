'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

type ThemeContextType = {
  theme: Theme
  accentColor: string
  setTheme: (theme: Theme) => void
  setAccentColor: (color: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({
  children,
  initialTheme = 'system',
  initialAccentColor = '#3c3cf6',
}: {
  children: React.ReactNode
  initialTheme?: Theme
  initialAccentColor?: string
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)
  const [accentColor, setAccentColorState] = useState<string>(initialAccentColor)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load theme from localStorage first (user preference takes priority)
    const storedTheme = localStorage.getItem('theme') as Theme | null
    const storedAccentColor = localStorage.getItem('accentColor')

    if (storedTheme) {
      setThemeState(storedTheme)
    } else if (initialTheme) {
      // Only use initialTheme if localStorage is empty
      localStorage.setItem('theme', initialTheme)
      setThemeState(initialTheme)
    }

    if (storedAccentColor) {
      setAccentColorState(storedAccentColor)
    } else if (initialAccentColor) {
      localStorage.setItem('accentColor', initialAccentColor)
      setAccentColorState(initialAccentColor)
    }
  }, []) // Only run once on mount

  // Update theme when initialTheme prop changes (from ThemeWrapper) - but only if localStorage is empty
  useEffect(() => {
    if (mounted && initialTheme) {
      const storedTheme = localStorage.getItem('theme') as Theme | null
      // Only update if localStorage doesn't have a value (first load scenario)
      if (!storedTheme && initialTheme !== theme) {
        setThemeState(initialTheme)
        localStorage.setItem('theme', initialTheme)
      }
    }
  }, [initialTheme, mounted, theme])

  // Update accent color when initialAccentColor prop changes (from ThemeWrapper) - but only if localStorage is empty
  useEffect(() => {
    if (mounted && initialAccentColor) {
      const storedAccentColor = localStorage.getItem('accentColor')
      // Only update if localStorage doesn't have a value (first load scenario)
      if (!storedAccentColor && initialAccentColor !== accentColor) {
        setAccentColorState(initialAccentColor)
        localStorage.setItem('accentColor', initialAccentColor)
      }
    }
  }, [initialAccentColor, mounted, accentColor])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    const effectiveTheme =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme

    root.classList.remove('light', 'dark')
    root.classList.add(effectiveTheme)

    // Update CSS variable for accent color
    root.style.setProperty('--color-primary', accentColor)
    
    // Calculate lighter/darker variants
    const hex = accentColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Lighter variant (20% opacity)
    root.style.setProperty('--color-primary-light', `${r}, ${g}, ${b}`)
    
    // Darker variant
    const darkerR = Math.max(0, r - 20)
    const darkerG = Math.max(0, g - 20)
    const darkerB = Math.max(0, b - 20)
    root.style.setProperty('--color-primary-dark', `${darkerR}, ${darkerG}, ${darkerB}`)

    localStorage.setItem('theme', theme)
    localStorage.setItem('accentColor', accentColor)
  }, [theme, accentColor, mounted])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
  }, [])

  const setAccentColor = useCallback((color: string) => {
    setAccentColorState(color)
  }, [])

  // Prevent flash of wrong theme
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
