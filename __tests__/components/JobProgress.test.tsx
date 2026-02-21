import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import JobProgress from '@/components/JobProgress'
import type { Job } from '@/types'

vi.mock('@/lib/supabase', () => ({
  createBrowserClient: vi.fn(() => ({
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    })),
    removeChannel: vi.fn(),
  })),
}))

function createJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-123',
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
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

describe('JobProgress', () => {
  it('renders all 7 pipeline steps with labels', () => {
    const job = createJob()
    render(<JobProgress initialJob={job} />)

    expect(screen.getByText(/Clone repository/)).toBeInTheDocument()
    expect(screen.getByText(/Scan for hardcoded strings/)).toBeInTheDocument()
    expect(screen.getByText(/Scaffold i18n infrastructure/)).toBeInTheDocument()
    expect(screen.getByText(/Transform source to use t\(\)/)).toBeInTheDocument()
    expect(screen.getByText(/Translate via Lingo.dev/)).toBeInTheDocument()
    expect(screen.getByText(/Commit and push to fork/)).toBeInTheDocument()
    expect(screen.getByText(/Open GitHub pull request/)).toBeInTheDocument()
  })

  it('renders ResultCard with job status', () => {
    const job = createJob()
    render(<JobProgress initialJob={job} />)
    expect(screen.getByText('Result')).toBeInTheDocument()
  })

  it('renders Process logs section', () => {
    const job = createJob()
    render(<JobProgress initialJob={job} />)
    expect(screen.getByText('Process logs')).toBeInTheDocument()
  })
})
