import { createClient } from '@supabase/supabase-js'
import type { Job, JobStatus, JobStats, LogEntry } from '../../types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  // In server runtime this will surface early; client code should not import this file.
  // eslint-disable-next-line no-console
  console.warn('Supabase URL or service role key is not set for agent logger.')
}

export const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null

export type LogEntryPatch = Omit<LogEntry, 'ts'> & { ts?: string }

async function getJob(jobId: string): Promise<Job | null> {
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error) {
    throw error
  }

  return data as Job
}

export async function log(jobId: string, entry: LogEntryPatch): Promise<void> {
  if (!supabaseAdmin) return

  const job = await getJob(jobId)
  if (!job) return

  const now = new Date().toISOString()
  const nextEntry: LogEntry = {
    step: entry.step,
    level: entry.level,
    message: entry.message,
    ts: entry.ts ?? now,
    ...(entry.data != null && { data: entry.data }),
  }

  const logs = [...(job.logs ?? []), nextEntry]

  const { error } = await supabaseAdmin
    .from('jobs')
    .update({ logs, updated_at: now })
    .eq('id', jobId)

  if (error) throw error
}

export async function setStatus(
  jobId: string,
  status: JobStatus,
  errorMessage?: string | null,
): Promise<void> {
  if (!supabaseAdmin) return

  const now = new Date().toISOString()
  const patch: Partial<Job> = {
    status,
    updated_at: now,
  }

  if (errorMessage) {
    patch.error = errorMessage
  }

  const { error } = await supabaseAdmin
    .from('jobs')
    .update(patch)
    .eq('id', jobId)

  if (error) throw error
}

export async function setCurrentStep(
  jobId: string,
  stepName: string | null,
): Promise<void> {
  if (!supabaseAdmin) return

  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from('jobs')
    .update({ current_step: stepName, updated_at: now })
    .eq('id', jobId)

  if (error) throw error
}

export async function updateStats(
  jobId: string,
  partialStats: Partial<JobStats>,
): Promise<void> {
  if (!supabaseAdmin) return

  const job = await getJob(jobId)
  if (!job) return

  const now = new Date().toISOString()
  const nextStats: JobStats = {
    filesModified: partialStats.filesModified ?? job.stats.filesModified,
    stringsFound: partialStats.stringsFound ?? job.stats.stringsFound,
    languagesAdded: partialStats.languagesAdded ?? job.stats.languagesAdded,
  }

  const { error } = await supabaseAdmin
    .from('jobs')
    .update({ stats: nextStats, updated_at: now })
    .eq('id', jobId)

  if (error) throw error
}

export async function setPrUrl(jobId: string, prUrl: string): Promise<void> {
  if (!supabaseAdmin) return

  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from('jobs')
    .update({ pr_url: prUrl, updated_at: now })
    .eq('id', jobId)

  if (error) throw error
}


