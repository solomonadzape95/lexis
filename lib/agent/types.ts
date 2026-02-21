import type { Job, JobStatus, JobStats, LogEntry, StringHit } from '../../types'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Octokit } from '@octokit/rest'
import type { DetectedFramework } from '@/lib/repo-detector'
import type { FrameworkAdapter } from './frameworks'

export type StringHitsByFile = Map<string, StringHit[]>

export type PipelineContext = {
  job: Job
  jobId: string
  workDir: string
  repoDir: string
  supabase: SupabaseClient
  octokit: Octokit
  githubUsername: string | null
  /** User's GitHub token for git push (not logged). Present when using user fork flow. */
  githubToken: string | null
  stats: JobStats
  stringHitsByFile: StringHitsByFile
  enMessages: Record<string, string>
  targetLanguages: string[]
  detectedFramework?: DetectedFramework
  frameworkAdapter?: FrameworkAdapter
}

export type PipelineStepName =
  | 'clone'
  | 'scan'
  | 'setup-i18n'
  | 'transform'
  | 'translate'
  | 'commit-push'
  | 'open-pr'

export type PipelineStep = (ctx: PipelineContext) => Promise<void>

