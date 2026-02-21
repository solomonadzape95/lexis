import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type AuthSession = {
  user: { id: string }
  providerToken: string | null
  githubUsername: string | null
  githubAvatarUrl: string | null
}

/**
 * Create a Supabase client for the current request (Server Components, Server Actions, Route Handlers).
 * Uses cookies for session; call getSession() to obtain the current user and GitHub token.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options ?? {}),
          )
        } catch {
          // Ignored when called from Server Component (read-only)
        }
      },
    },
  })
}

/**
 * Get the current session and GitHub provider token. Returns null if not signed in or no GitHub token.
 * Uses getUser() to verify authentication securely, then getSession() to retrieve provider_token.
 */
export async function getSession(): Promise<AuthSession | null> {
  const supabase = await createServerSupabaseClient()
  
  // Use getUser() to securely verify authentication (contacts Supabase Auth server)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return null

  // Get session to retrieve provider_token (OAuth token)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session) return null

  const token = (session as { provider_token?: string }).provider_token ?? null
  
  // Return session even without token for UI purposes (token check happens at job creation)
  // Resolve GitHub username and avatar from GitHub API or user_metadata
  let githubUsername: string | null =
    (user.user_metadata?.user_name as string) ??
    (user.user_metadata?.login as string) ??
    null
  
  let githubAvatarUrl: string | null =
    (user.user_metadata?.avatar_url as string) ??
    (user.user_metadata?.picture as string) ??
    null
    
  if ((!githubUsername || !githubAvatarUrl) && token) {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = (await res.json()) as { login?: string; avatar_url?: string }
        if (!githubUsername) githubUsername = data.login ?? null
        if (!githubAvatarUrl) githubAvatarUrl = data.avatar_url ?? null
      }
    } catch {
      // keep null
    }
  }

  return {
    user: { id: user.id }, // Use user from getUser() for security
    providerToken: token,
    githubUsername,
    githubAvatarUrl,
  }
}
