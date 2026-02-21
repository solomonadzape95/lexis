import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/jobs/[jobId]/route'

const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

vi.mock('@/lib/agent/logger', () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}))

describe('GET /api/jobs/[jobId]', () => {
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

    const res = await GET(
      {} as any,
      { params: { jobId: 'nonexistent' } } as any,
    )
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toContain('not found')
  })

  it('returns job when found', async () => {
    const job = {
      id: 'job-123',
      repo_url: 'https://github.com/owner/repo',
      status: 'running',
      current_step: 'scan',
      logs: [],
      stats: { filesModified: 0, stringsFound: 0, languagesAdded: 0 },
    }
    mockSingle.mockResolvedValue({ data: job, error: null })

    const res = await GET(
      {} as any,
      { params: { jobId: 'job-123' } } as any,
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject(job)
    expect(mockEq).toHaveBeenCalledWith('id', 'job-123')
  })
})
