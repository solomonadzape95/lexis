import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/agent/logger'
import { getSession } from '@/lib/supabase-server'
import type { Job } from '@/types'

type RouteParams = {
  params: {
    jobId: string
  }
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
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

  const job = data as Job
  if (job.user_id != null && job.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 })
  }

  return NextResponse.json(job)
}
