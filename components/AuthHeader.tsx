'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function AuthHeader() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (!user) return null

  return (
    <header className="flex items-center justify-end gap-4 border-b border-slate-800 pb-4">
      <span className="text-sm text-slate-400">
        {user.user_metadata?.user_name ?? user.email ?? 'Signed in'}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="text-sm text-slate-400 underline-offset-4 hover:text-slate-300 hover:underline"
      >
        Sign out
      </button>
    </header>
  )
}
