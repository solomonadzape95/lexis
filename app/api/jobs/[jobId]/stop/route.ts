import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/agent/logger'
import { getSession } from '@/lib/supabase-server'
import type { Job } from '@/types'

type RouteParams = {
  params: { jobId: string }
}

export async function POST(_req: Request, { params }: RouteParams) {
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
    .select('status, user_id')
    .eq('id', jobId)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: 'Job not found.', details: (error as { message?: string })?.message },
      { status: 404 },
    )
  }

  const job = data as Pick<Job, 'status' | 'user_id'>
  if (job.user_id != null && job.user_id !== session.user.id) {
    return NextResponse.json(
      { error: 'You do not have access to this job.' },
      { status: 403 },
    )
  }
  if (job.status !== 'running') {
    return NextResponse.json(
      { message: `Job is ${job.status}, cannot stop.` },
      { status: 400 },
    )
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabaseAdmin
    .from('jobs')
    .update({
      status: 'cancelled',
      error: 'Cancelled by user.',
      current_step: null,
      updated_at: now,
    })
    .eq('id', jobId)

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to cancel job.', details: updateError.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ stopped: true }, { status: 200 })
}
