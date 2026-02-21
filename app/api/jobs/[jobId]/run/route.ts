import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/agent/logger'
import { getSession } from '@/lib/supabase-server'
import { runPipeline } from '@/lib/agent/pipeline'
import type { Job } from '@/types'

export const runtime = 'nodejs'

type RouteParams = {
  params: {
    jobId: string
  }
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
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

  const { jobId } = params

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: 'Job not found.', details: (error as { message?: string })?.message },
      { status: 404 },
    )
  }

  let job = data as Job
  if (job.user_id != null && job.user_id !== session.user.id) {
    return NextResponse.json(
      { error: 'You do not have access to this job.' },
      { status: 403 },
    )
  }

  // Require GitHub token before changing job state (avoids leaving job stuck as pending)
  if (!session.providerToken) {
    return NextResponse.json(
      { error: 'Sign in with GitHub to run the pipeline.' },
      { status: 400 },
    )
  }

  // Allow retry for failed or cancelled jobs: reset to pending then run
  if (job.status === 'failed' || job.status === 'cancelled') {
    const { error: updateError } = await supabaseAdmin
      .from('jobs')
      .update({
        status: 'pending',
        error: null,
        current_step: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to reset job for retry.', details: (updateError as { message?: string })?.message },
        { status: 500 },
      )
    }
    job = { ...job, status: 'pending' as const, error: null, current_step: null }
  } else if (job.status !== 'pending') {
    return NextResponse.json(
      { message: `Job is already ${job.status}, not starting again.` },
      { status: 200 },
    )
  }

  runPipeline(job, {
    githubToken: session.providerToken,
    githubUsername: session.githubUsername ?? job.github_username ?? undefined,
  }).catch(() => {})

  return NextResponse.json({ started: true }, { status: 202 })
}
