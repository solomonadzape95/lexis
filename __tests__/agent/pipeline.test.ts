import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Job } from '@/types'
import { runPipeline } from '@/lib/agent/pipeline'

const mockLog = vi.fn()
const mockSetStatus = vi.fn()
const mockSetCurrentStep = vi.fn()

vi.mock('@/lib/agent/logger', () => ({
  log: (...args: unknown[]) => mockLog(...args),
  setStatus: (...args: unknown[]) => mockSetStatus(...args),
  setCurrentStep: (...args: unknown[]) => mockSetCurrentStep(...args),
}))

vi.mock('@/lib/agent/steps/1-clone', () => ({ default: vi.fn() }))
vi.mock('@/lib/agent/steps/2-scan', () => ({ default: vi.fn() }))
vi.mock('@/lib/agent/steps/3-setup-i18n', () => ({ default: vi.fn() }))
vi.mock('@/lib/agent/steps/4-transform', () => ({ default: vi.fn() }))
vi.mock('@/lib/agent/steps/5-translate', () => ({ default: vi.fn() }))
vi.mock('@/lib/agent/steps/6-commit-push', () => ({ default: vi.fn() }))
vi.mock('@/lib/agent/steps/7-open-pr', () => ({ default: vi.fn() }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({})),
}))

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(() => ({})),
}))

const createJob = (overrides: Partial<Job> = {}): Job => ({
  id: 'test-job-id',
  user_id: null,
  github_username: null,
  repo_url: 'https://github.com/owner/repo',
  repo_owner: 'owner',
  repo_name: 'repo',
  languages: ['es', 'fr'],
  status: 'pending',
  current_step: null,
  pr_url: null,
  stats: { filesModified: 0, stringsFound: 0, languagesAdded: 0 },
  logs: [],
  error: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

describe('runPipeline', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
      GITHUB_TOKEN: 'test-token',
    }
  })

  it('throws when Supabase env vars are not set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ''
    process.env.SUPABASE_SERVICE_ROLE_KEY = ''

    await expect(runPipeline(createJob())).rejects.toThrow(
      'Supabase environment variables are not configured',
    )
    expect(mockSetStatus).not.toHaveBeenCalled()
  })

  it('runs all steps in order and completes successfully', async () => {
    const cloneStep = (await import('@/lib/agent/steps/1-clone')).default
    const scanStep = (await import('@/lib/agent/steps/2-scan')).default
    const setupI18nStep = (await import('@/lib/agent/steps/3-setup-i18n')).default
    const transformStep = (await import('@/lib/agent/steps/4-transform')).default
    const translateStep = (await import('@/lib/agent/steps/5-translate')).default
    const commitPushStep = (await import('@/lib/agent/steps/6-commit-push')).default
    const openPrStep = (await import('@/lib/agent/steps/7-open-pr')).default

    vi.mocked(cloneStep).mockResolvedValue(undefined)
    vi.mocked(scanStep).mockResolvedValue(undefined)
    vi.mocked(setupI18nStep).mockResolvedValue(undefined)
    vi.mocked(transformStep).mockResolvedValue(undefined)
    vi.mocked(translateStep).mockResolvedValue(undefined)
    vi.mocked(commitPushStep).mockResolvedValue(undefined)
    vi.mocked(openPrStep).mockResolvedValue(undefined)

    const job = createJob()
    await runPipeline(job)

    const stepOrder = [
      cloneStep,
      scanStep,
      setupI18nStep,
      transformStep,
      translateStep,
      commitPushStep,
      openPrStep,
    ]
    for (const step of stepOrder) {
      expect(step).toHaveBeenCalledTimes(1)
    }

    expect(mockSetStatus).toHaveBeenNthCalledWith(1, 'test-job-id', 'running')
    expect(mockSetStatus).toHaveBeenNthCalledWith(2, 'test-job-id', 'completed')
    expect(mockSetCurrentStep).toHaveBeenLastCalledWith('test-job-id', null)

    const logCalls = mockLog.mock.calls
    const stepNames = ['clone', 'scan', 'setup-i18n', 'transform', 'translate', 'commit-push', 'open-pr']
    for (const name of stepNames) {
      expect(logCalls.some((c) => c[1]?.step === name && c[1]?.level === 'info')).toBe(true)
      expect(logCalls.some((c) => c[1]?.step === name && c[1]?.level === 'success')).toBe(true)
    }
  })

  it('sets status to failed and logs error when a step throws', async () => {
    const cloneStep = (await import('@/lib/agent/steps/1-clone')).default
    vi.mocked(cloneStep).mockRejectedValue(new Error('Clone failed'))

    const job = createJob()
    await expect(runPipeline(job)).rejects.toThrow('Clone failed')

    expect(mockSetStatus).toHaveBeenNthCalledWith(1, 'test-job-id', 'running')
    expect(mockSetStatus).toHaveBeenNthCalledWith(2, 'test-job-id', 'failed', 'Clone failed')
    expect(mockSetCurrentStep).toHaveBeenLastCalledWith('test-job-id', null)
    expect(mockLog).toHaveBeenCalledWith(
      'test-job-id',
      expect.objectContaining({
        step: 'pipeline',
        level: 'error',
        message: 'Clone failed',
      }),
    )
  })
})
