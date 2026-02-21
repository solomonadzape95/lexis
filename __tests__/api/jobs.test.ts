import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/jobs/route'

const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockFrom = vi.fn()
const mockOrder = vi.fn()

vi.mock('@/lib/agent/logger', () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}))

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    repos: {
      get: vi.fn().mockResolvedValue({ data: { private: false } }),
    },
  })),
}))

describe('POST /api/jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      order: mockOrder,
    })
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'test-job-id',
            repo_url: 'https://github.com/owner/repo',
            repo_owner: 'owner',
            repo_name: 'repo',
            languages: ['es', 'fr'],
            status: 'pending',
          },
          error: null,
        }),
      }),
    })
    mockOrder.mockReturnValue({
      ascending: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  })

  it('rejects when repoUrl is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/jobs', {
      method: 'POST',
      body: JSON.stringify({ languages: ['es'] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('repoUrl')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('rejects invalid GitHub URL', async () => {
    const req = new NextRequest('http://localhost:3000/api/jobs', {
      method: 'POST',
      body: JSON.stringify({ repoUrl: 'https://gitlab.com/owner/repo', languages: [] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Invalid GitHub')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('returns 404 when repository does not exist', async () => {
    const { Octokit } = await import('@octokit/rest')
    vi.mocked(Octokit).mockImplementationOnce(
      () =>
        ({
          repos: {
            get: vi.fn().mockRejectedValue(new Error('Not Found')),
          },
        }) as any,
    )

    const req = new NextRequest('http://localhost:3000/api/jobs', {
      method: 'POST',
      body: JSON.stringify({
        repoUrl: 'https://github.com/nonexistent/repo',
        languages: ['es'],
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toContain('not found')
  })

  it('returns 400 for private repository', async () => {
    const { Octokit } = await import('@octokit/rest')
    vi.mocked(Octokit).mockImplementationOnce(
      () =>
        ({
          repos: {
            get: vi.fn().mockResolvedValue({ data: { private: true } }),
          },
        }) as any,
    )

    const req = new NextRequest('http://localhost:3000/api/jobs', {
      method: 'POST',
      body: JSON.stringify({
        repoUrl: 'https://github.com/owner/private-repo',
        languages: ['es'],
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('public')
  })

  it('creates job and returns jobId on valid request', async () => {
    const req = new NextRequest('http://localhost:3000/api/jobs', {
      method: 'POST',
      body: JSON.stringify({
        repoUrl: 'https://github.com/owner/repo',
        languages: ['es', 'fr'],
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.jobId).toBe('test-job-id')

    expect(mockFrom).toHaveBeenCalledWith('jobs')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        repo_url: 'https://github.com/owner/repo',
        repo_owner: 'owner',
        repo_name: 'repo',
        languages: ['es', 'fr'],
        status: 'pending',
      }),
    )

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/jobs/test-job-id/run',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})

describe('GET /api/jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [{ id: 'job-1', status: 'completed' }],
          error: null,
        }),
      }),
    })
  })

  it('returns list of jobs when Supabase is configured', async () => {
    const req = new NextRequest('http://localhost:3000/api/jobs')
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json[0]).toMatchObject({ id: 'job-1', status: 'completed' })
  })
})
