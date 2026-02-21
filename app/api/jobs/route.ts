import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/agent/logger'
import { getSession } from '@/lib/supabase-server'
import { runPipeline } from '@/lib/agent/pipeline'
import { Octokit } from '@octokit/rest'
import type { Job } from '@/types'

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabase is not configured on the server.' },
      { status: 500 },
    )
  }

  const body = await req.json().catch(() => null)
  const repoUrl = body?.repoUrl as string | undefined
  const languages = (body?.languages as string[] | undefined) ?? []

  let userId: string
  let githubToken: string
  let githubUsername: string | null

  const session = await getSession()
  if (session) {
    userId = session.user.id
    githubToken = session.providerToken!
    githubUsername = session.githubUsername
  } else if (
    body?.userId &&
    body?.githubToken &&
    typeof body.userId === 'string' &&
    typeof body.githubToken === 'string'
  ) {
    userId = body.userId
    githubToken = body.githubToken
    githubUsername =
      typeof body.githubUsername === 'string' ? body.githubUsername : null
  } else {
    return NextResponse.json(
      { error: 'Sign in required. Sign in with GitHub to run the pipeline.' },
      { status: 401 },
    )
  }

  if (!repoUrl) {
    return NextResponse.json({ error: 'repoUrl is required.' }, { status: 400 })
  }

  const match = repoUrl.match(/github\.com\/(.+?)\/(.+?)(?:\.git)?(?:\/)?$/)
  if (!match) {
    return NextResponse.json(
      { error: 'Invalid GitHub repository URL.' },
      { status: 400 },
    )
  }

  const [, owner, repo] = match

  const octokit = new Octokit({ auth: githubToken })
  try {
    const { data } = await octokit.repos.get({ owner, repo })
    if (data.private) {
      return NextResponse.json(
        { error: 'Please use a public repository.' },
        { status: 400 },
      )
    }
  } catch {
    return NextResponse.json(
      { error: 'Repository not found.' },
      { status: 404 },
    )
  }

  if (!githubUsername) {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${githubToken}` },
      })
      if (res.ok) {
        const data = (await res.json()) as { login?: string }
        githubUsername = data.login ?? null
      }
    } catch {
      // keep null
    }
  }

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .insert({
      repo_url: repoUrl,
      repo_owner: owner,
      repo_name: repo,
      languages,
      status: 'pending',
      user_id: userId,
      github_username: githubUsername,
    })
    .select('*')
    .single()

  if (error || !data) {
    const message = error?.message ?? 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create job.', details: message },
      { status: 500 },
    )
  }

  const job = data as Job

  runPipeline(job, {
    githubToken,
    githubUsername: githubUsername ?? undefined,
  }).catch(() => {})

  return NextResponse.json({ jobId: job.id }, { status: 201 })
}

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabase is not configured on the server.' },
      { status: 500 },
    )
  }

  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Sign in required.' },
      { status: 401 },
    )
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') ?? '50', 10)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  let query = supabaseAdmin
    .from('jobs')
    .select('*', { count: 'exact' })
    // Include both new jobs (with user_id) and older jobs (user_id is null but github_username matches)
    .or(
      `user_id.eq.${session.user.id},and(user_id.is.null,github_username.eq.${session.githubUsername ?? ''})`,
    )

  // Filter by status
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // Search by repo name or owner
  if (search) {
    query = query.or(`repo_name.ilike.%${search}%,repo_owner.ilike.%${search}%`)
  }

  // Pagination
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch jobs.', details: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({
    jobs: data ?? [],
    total: count ?? 0,
    limit,
    offset,
  })
}
