export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export type LogLevel = 'info' | 'success' | 'warning' | 'error'

export type LogEntry = {
  step: string
  message: string
  ts: string
  level: LogLevel
  data?: Record<string, unknown>
}

export type JobStats = {
  filesModified: number
  stringsFound: number
  languagesAdded: number
}

export type Job = {
  id: string
  user_id: string | null
  github_username: string | null
  repo_url: string
  repo_owner: string
  repo_name: string
  languages: string[]
  status: JobStatus
  current_step: string | null
  pr_url: string | null
  stats: JobStats
  logs: LogEntry[]
  error: string | null
  created_at: string
  updated_at: string
}

export type StringHitType = 'JSXText' | 'JSXAttribute' | 'StringLiteral'

export type StringHit = {
  value: string
  line: number
  column: number
  type: StringHitType
  attributeName?: string
}

export type PipelineStats = JobStats

