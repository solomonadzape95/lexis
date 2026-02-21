import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/supabase-server'
import { detectFrameworks } from '@/lib/repo-detector'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !session.providerToken) {
    return NextResponse.json(
      { error: 'Sign in required.' },
      { status: 401 },
    )
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body.owner !== 'string' || typeof body.repo !== 'string') {
    return NextResponse.json(
      { error: 'Invalid request body. Expected { owner: string, repo: string }' },
      { status: 400 },
    )
  }

  try {
    const frameworks = await detectFrameworks(
      body.owner,
      body.repo,
      session.providerToken,
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
