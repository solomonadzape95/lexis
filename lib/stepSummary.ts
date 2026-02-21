import type { Job } from '@/types'

/**
 * Returns a short human-readable summary for a pipeline step from job logs and stats.
 * Used by the dashboard to show step-specific info (e.g. "12 files, 47 strings", "5/12 files (42%)").
 */
export function getStepSummary(job: Job, stepId: string): string | null {
  const logs = job.logs ?? []
  const stepLogs = logs.filter((e) => e.step === stepId)
  const lastWithData = [...stepLogs].reverse().find((e) => e.data != null)
  const data = lastWithData?.data as Record<string, unknown> | undefined

  switch (stepId) {
    case 'clone':
      return data?.repoPath != null ? 'Cloned' : null
    case 'scan':
      if (data?.filesWithStrings != null && data?.totalStrings != null) {
        return `${data.filesWithStrings} files, ${data.totalStrings} strings`
      }
      return null
    case 'setup-i18n':
      if (Array.isArray(data?.localesAdded) && data.localesAdded.length > 0) {
        return `Locales: ${(data.localesAdded as string[]).join(', ')}`
      }
      return null
    case 'transform': {
      if (
        data?.completedFiles != null &&
        data?.totalFiles != null &&
        typeof data.totalFiles === 'number' &&
        data.totalFiles > 0
      ) {
        const completed = Number(data.completedFiles)
        const total = Number(data.totalFiles)
        const pct = Math.round((completed / total) * 100)
        const str = data?.stringsExtracted != null ? `, ${data.stringsExtracted} strings` : ''
        return `${completed}/${total} files (${pct}%)${str}`
      }
      if (job.status === 'completed' && job.stats) {
        const { filesModified, stringsFound } = job.stats
        return `${filesModified} files, ${stringsFound} strings`
      }
      return null
    }
    case 'translate':
      if (data?.languagesCount != null) {
        return `${data.languagesCount} languages`
      }
      return null
    case 'commit-push':
      if (data?.branch != null) {
        return `Branch: ${data.branch}`
      }
      return null
    case 'open-pr':
      if (data?.prUrl != null) {
        return 'PR opened'
      }
      return null
    default:
      return null
  }
}
