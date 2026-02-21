import { NextResponse } from 'next/server'
import { getSession } from '@/lib/supabase-server'

export async function GET() {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ providerToken: null })
  }

  return NextResponse.json({
    providerToken: session.providerToken,
    githubUsername: session.githubUsername,
    githubAvatarUrl: session.githubAvatarUrl,
  })
}
