'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { createBrowserClient } from '@/lib/supabase'
import Icon from './Icon'

type Props = {
  avatarUrl?: string | null
  username?: string | null
  displayName?: string | null
}

export default function ProfileDropdown({ avatarUrl, username, displayName }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<{ avatarUrl: string | null; username: string | null; displayName: string | null }>({
    avatarUrl: avatarUrl ?? null,
    username: username ?? null,
    displayName: displayName ?? null,
  })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Fetch user profile data
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const profile = await res.json()
          setUser({
            avatarUrl: profile.github_avatar_url ?? avatarUrl ?? null,
            username: profile.display_name ?? username ?? null,
            displayName: profile.display_name ?? username ?? null,
          })
        }
      } catch {
        // Use props as fallback
      }
    }
    fetchProfile()
  }, [avatarUrl, username])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    try {
      setIsOpen(false)
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        alert(`Sign out failed: ${error.message}`)
        return
      }
      
      // Redirect to home page and refresh
      router.push('/')
      router.refresh()
      
      // Force a hard refresh to clear any cached state
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (err) {
      console.error('Sign out error:', err)
      alert('Failed to sign out. Please try again.')
    }
  }

  const displayText = user.displayName ?? user.username ?? 'Account'
  const initials = displayText
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={displayText}
            width={32}
            height={32}
            className="rounded-full"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold">
            {initials}
          </div>
        )}
        <span className="hidden md:block text-sm font-medium text-slate-900 dark:text-white">
          {displayText}
        </span>
        <Icon name="arrow_forward_ios" size={16} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 max-w-[min(14rem,calc(100vw-2rem))] bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-2 z-50">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-900 dark:text-white">{displayText}</p>
            {user.username && (
              <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
            )}
          </div>
          
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Icon name="dashboard" size={18} />
            Dashboard
          </Link>
          
          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Icon name="person" size={18} />
            Profile Settings
          </Link>
          
          <div className="border-t border-slate-200 dark:border-slate-800 mt-2 pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Icon name="error" size={18} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
