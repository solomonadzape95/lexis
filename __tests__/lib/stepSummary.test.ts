import { describe, it, expect } from 'vitest'
import { getStepSummary } from '@/lib/stepSummary'
import type { Job } from '@/types'

function createJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-123',
    user_id: null,
    github_username: null,
    repo_url: '',
    repo_owner: '',
    repo_name: '',
    languages: [],
    status: 'pending',
    current_step: null,
    pr_url: null,
    stats: { filesModified: 0, stringsFound: 0, languagesAdded: 0 },
    logs: [],
    error: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

describe('getStepSummary', () => {
  it('returns null for clone when no data', () => {
    expect(getStepSummary(createJob(), 'clone')).toBeNull()
  })

  it('returns "Cloned" for clone when repoPath in data', () => {
    const job = createJob({
      logs: [
        { step: 'clone', level: 'success', message: 'Done', ts: '', data: { repoPath: '/tmp/repo' } },
      ],
    })
    expect(getStepSummary(job, 'clone')).toBe('Cloned')
  })

  it('returns "X files, Y strings" for scan from data', () => {
    const job = createJob({
      logs: [
        {
          step: 'scan',
          level: 'info',
          message: 'Found strings',
          ts: '',
          data: { filesWithStrings: 12, totalStrings: 47 },
        },
      ],
    })
    expect(getStepSummary(job, 'scan')).toBe('12 files, 47 strings')
  })

  it('returns "Locales: ..." for setup-i18n from localesAdded', () => {
    const job = createJob({
      logs: [
        {
          step: 'setup-i18n',
          level: 'info',
          message: 'Scaffolded',
          ts: '',
          data: { localesAdded: ['en', 'es', 'fr'] },
        },
      ],
    })
    expect(getStepSummary(job, 'setup-i18n')).toBe('Locales: en, es, fr')
  })

  it('returns "A/B files (Z%)" for transform from data', () => {
    const job = createJob({
      logs: [
        {
          step: 'transform',
          level: 'info',
          message: 'Progress',
          ts: '',
          data: { completedFiles: 5, totalFiles: 12, stringsExtracted: 30 },
        },
      ],
    })
    expect(getStepSummary(job, 'transform')).toBe('5/12 files (42%), 30 strings')
  })

  it('returns transform summary from job.stats when completed and no log data', () => {
    const job = createJob({
      status: 'completed',
      stats: { filesModified: 8, stringsFound: 40, languagesAdded: 2 },
    })
    expect(getStepSummary(job, 'transform')).toBe('8 files, 40 strings')
  })

  it('returns "N languages" for translate from data', () => {
    const job = createJob({
      logs: [
        {
          step: 'translate',
          level: 'success',
          message: 'Done',
          ts: '',
          data: { languagesCount: 3 },
        },
      ],
    })
    expect(getStepSummary(job, 'translate')).toBe('3 languages')
  })

  it('returns "Branch: ..." for commit-push from data', () => {
    const job = createJob({
      logs: [
        {
          step: 'commit-push',
          level: 'success',
          message: 'Pushed',
          ts: '',
          data: { branch: 'feat/i18n-lingo-dev' },
        },
      ],
    })
    expect(getStepSummary(job, 'commit-push')).toBe('Branch: feat/i18n-lingo-dev')
  })

  it('returns "PR opened" for open-pr from data', () => {
    const job = createJob({
      logs: [
        {
          step: 'open-pr',
          level: 'success',
          message: 'PR opened',
          ts: '',
          data: { prUrl: 'https://github.com/owner/repo/pull/1' },
        },
      ],
    })
    expect(getStepSummary(job, 'open-pr')).toBe('PR opened')
  })

  it('returns null for unknown stepId', () => {
    expect(getStepSummary(createJob(), 'unknown-step')).toBeNull()
  })
})
