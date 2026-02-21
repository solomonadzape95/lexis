import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/jobs/[jobId]/run/route'
import { runPipeline } from '@/lib/agent/pipeline'

const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

vi.mock('@/lib/agent/logger', () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}))

vi.mock('@/lib/agent/pipeline', () => ({
  runPipeline: vi.fn(),
}))

describe('POST /api/jobs/[jobId]/run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({
      select: mockSelect,
    })
    mockSelect.mockReturnValue({
      eq: mockEq,
    })
    mockEq.mockReturnValue({
      single: mockSingle,
    })
  })

  it('returns 404 when job not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    const res = await POST(
      {} as any,
      { params: { jobId: 'nonexistent' } } as any,
    )
    expect(res.status).toBe(404)
    expect(runPipeline).not.toHaveBeenCalled()
  })

  it('no-ops and returns 200 when job is already running', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 'job-123',
        status: 'running',
        repo_url: 'https://github.com/owner/repo',
        repo_owner: 'owner',
        repo_name: 'repo',
        languages: ['es'],
        current_step: null,
        pr_url: null,
        stats: { filesModified: 0, stringsFound: 0, languagesAdded: 0 },
        logs: [],
        error: null,
        created_at: '',
        updated_at: '',
      },
      error: null,
    })

    const res = await POST(
      {} as any,
      { params: { jobId: 'job-123' } } as any,
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toContain('running')
    expect(runPipeline).not.toHaveBeenCalled()
  })

  it('no-ops and returns 200 when job is already completed', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 'job-123',
        status: 'completed',
        repo_url: 'https://github.com/owner/repo',
        repo_owner: 'owner',
        repo_name: 'repo',
        languages: ['es'],
        current_step: null,
        pr_url: 'https://github.com/owner/repo/pull/1',
        stats: { filesModified: 5, stringsFound: 10, languagesAdded: 3 },
        logs: [],
        error: null,
        created_at: '',
        updated_at: '',
      },
      error: null,
    })

    const res = await POST(
      {} as any,
      { params: { jobId: 'job-123' } } as any,
    )
    expect(res.status).toBe(200)
    expect(runPipeline).not.toHaveBeenCalled()
  })

  it('starts pipeline and returns 202 when job is pending', async () => {
    const job = {
      id: 'job-123',
      status: 'pending',
      repo_url: 'https://github.com/owner/repo',
      repo_owner: 'owner',
      repo_name: 'repo',
      languages: ['es'],
      current_step: null,
      pr_url: null,
      stats: { filesModified: 0, stringsFound: 0, languagesAdded: 0 },
      logs: [],
      error: null,
      created_at: '',
      updated_at: '',
    }
    mockSingle.mockResolvedValue({ data: job, error: null })
    vi.mocked(runPipeline).mockResolvedValue(undefined)

    const res = await POST(
      {} as any,
      { params: { jobId: 'job-123' } } as any,
    )
    expect(res.status).toBe(202)
    const json = await res.json()
    expect(json.started).toBe(true)
    expect(runPipeline).toHaveBeenCalledWith(job)
  })
})
