import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProcessLogs from '@/components/ProcessLogs'
import type { LogEntry } from '@/types'

describe('ProcessLogs', () => {
  it('renders "No logs yet" when logs is empty', () => {
    render(<ProcessLogs logs={[]} />)
    expect(screen.getByText('No logs yet.')).toBeInTheDocument()
    expect(screen.getByText('Process logs')).toBeInTheDocument()
  })

  it('renders log entries with timestamp, step, level, and message', () => {
    const logs: LogEntry[] = [
      { step: 'clone', level: 'info', message: 'Cloning repo', ts: '2025-01-15T10:00:00.000Z' },
      { step: 'clone', level: 'success', message: 'Cloned', ts: '2025-01-15T10:00:05.000Z' },
    ]
    render(<ProcessLogs logs={logs} />)
    expect(screen.getByText('Cloning repo')).toBeInTheDocument()
    expect(screen.getByText('Cloned')).toBeInTheDocument()
    expect(screen.getAllByText('clone').length).toBe(2)
    expect(screen.getByText('info')).toBeInTheDocument()
    expect(screen.getByText('success')).toBeInTheDocument()
  })

  it('renders log data when present', () => {
    const logs: LogEntry[] = [
      {
        step: 'scan',
        level: 'info',
        message: 'Found strings',
        ts: '2025-01-15T10:00:00.000Z',
        data: { filesWithStrings: 5, totalStrings: 20 },
      },
    ]
    render(<ProcessLogs logs={logs} />)
    expect(screen.getByText('Found strings')).toBeInTheDocument()
    expect(screen.getByText(/filesWithStrings: 5, totalStrings: 20/)).toBeInTheDocument()
  })
})
