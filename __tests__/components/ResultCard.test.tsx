import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResultCard from '@/components/ResultCard'
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

describe('ResultCard', () => {
  it('displays status and stats', () => {
    const job = createJob({ status: 'running', stats: { filesModified: 0, stringsFound: 0, languagesAdded: 0 } })
    render(<ResultCard job={job} />)
    expect(screen.getByText('running')).toBeInTheDocument()
    expect(screen.getByText(/0 files modified/)).toBeInTheDocument()
  })

  it('shows View pull request button only when completed with pr_url', () => {
    const job = createJob({
      status: 'completed',
      pr_url: 'https://github.com/owner/repo/pull/1',
      stats: { filesModified: 5, stringsFound: 10, languagesAdded: 3 },
    })
    render(<ResultCard job={job} />)
    const link = screen.getByRole('link', { name: /View pull request/ })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://github.com/owner/repo/pull/1')
  })

  it('does not show PR button when status is not completed', () => {
    const job = createJob({ status: 'running', pr_url: 'https://example.com/pr' })
    render(<ResultCard job={job} />)
    expect(screen.queryByRole('link', { name: /View pull request/ })).not.toBeInTheDocument()
  })

  it('renders error message when job failed', () => {
    const job = createJob({ status: 'failed', error: 'Clone failed' })
    render(<ResultCard job={job} />)
    expect(screen.getByText(/Clone failed/)).toBeInTheDocument()
  })
})
