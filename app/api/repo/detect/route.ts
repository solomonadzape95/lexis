import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/supabase-server'
import { detectFrameworks } from '@/lib/repo-detector'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body.owner !== 'string' || typeof body.repo !== 'string') {
    return NextResponse.json(
      { error: 'Invalid request body. Expected { owner: string, repo: string }' },
      { status: 400 },
    )
  }

  // Use GitHub token if signed in (better rate limits, private repos); otherwise public repos only
  const session = await getSession()
  const token = session?.providerToken ?? undefined

  try {
    const frameworks = await detectFrameworks(
      body.owner,
      body.repo,
      token ?? '',
    )

    return NextResponse.json({ frameworks })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to detect frameworks'
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}
