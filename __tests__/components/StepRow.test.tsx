import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StepRow from '@/components/StepRow'
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

describe('StepRow', () => {
  it('shows pending status when step not started', () => {
    const job = createJob({ status: 'running', current_step: 'scan' })
    render(<StepRow index={1} stepId="clone" label="Clone repository" job={job} />)
    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('shows running status when current_step matches', () => {
    const job = createJob({ status: 'running', current_step: 'clone' })
    render(<StepRow index={1} stepId="clone" label="Clone repository" job={job} />)
    expect(screen.getByText('running')).toBeInTheDocument()
  })

  it('shows done status when step has success log', () => {
    const job = createJob({
      status: 'running',
      current_step: 'scan',
      logs: [{ step: 'clone', level: 'success', message: 'Done', ts: '' }],
    })
    render(<StepRow index={1} stepId="clone" label="Clone repository" job={job} />)
    expect(screen.getByText('done')).toBeInTheDocument()
  })

  it('shows failed status when job failed', () => {
    const job = createJob({ status: 'failed' })
    render(<StepRow index={1} stepId="clone" label="Clone repository" job={job} />)
    expect(screen.getByText('failed')).toBeInTheDocument()
  })

  it('renders step-specific summary when summary prop is provided', () => {
    const job = createJob()
    render(
      <StepRow
        index={2}
        stepId="scan"
        label="Scan for hardcoded strings"
        job={job}
        summary="12 files, 47 strings"
      />,
    )
    expect(screen.getByText('12 files, 47 strings')).toBeInTheDocument()
  })

  it('does not render summary line when summary is null', () => {
    const job = createJob()
    const { container } = render(
      <StepRow index={1} stepId="clone" label="Clone repository" job={job} />,
    )
    expect(container.querySelectorAll('p').length).toBe(1)
  })
})
