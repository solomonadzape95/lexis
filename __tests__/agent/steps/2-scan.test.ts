import { describe, it, expect, vi, beforeEach } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import { mkdtempSync } from 'node:fs'
import scanStep from '@/lib/agent/steps/2-scan'
import type { PipelineContext } from '@/lib/agent/types'
import type { Job } from '@/types'

vi.mock('@/lib/agent/logger', () => ({
  log: vi.fn(),
}))

function createContext(repoDir: string): PipelineContext {
  return {
    job: {
      id: 'test',
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
    } as Job,
    jobId: 'test',
    workDir: '',
    repoDir,
    supabase: {} as any,
    octokit: {} as any,
    stats: { filesModified: 0, stringsFound: 0, languagesAdded: 0 },
    stringHitsByFile: new Map(),
    enMessages: {},
    targetLanguages: ['es'],
  }
}

describe('scanStep', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(tmpdir(), 'scan-test-'))
  })

  it('captures JSXText and allowed JSXAttribute strings', async () => {
    const appDir = path.join(tmpDir, 'app')
    await fs.promises.mkdir(appDir, { recursive: true })
    await fs.promises.writeFile(
      path.join(appDir, 'Component.tsx'),
      `export function Component() {
  return (
    <div>
      <h1>Hello World</h1>
      <p>Welcome</p>
      <img alt="Logo" />
      <input placeholder="Enter name" />
    </div>
  )
}
`,
      'utf8',
    )

    const ctx = createContext(tmpDir)
    await scanStep(ctx)

    expect(ctx.stringHitsByFile.size).toBeGreaterThan(0)
    const filePath = path.join(appDir, 'Component.tsx')
    const hits = ctx.stringHitsByFile.get(filePath) ?? []
    expect(hits.length).toBeGreaterThan(0)

    const values = hits.map((h) => h.value)
    expect(values).toContain('Hello World')
    expect(values).toContain('Welcome')
    expect(values).toContain('Logo')
    expect(values).toContain('Enter name')

    const jsxTextHits = hits.filter((h) => h.type === 'JSXText')
    expect(jsxTextHits.length).toBeGreaterThan(0)
    const jsxAttrHits = hits.filter((h) => h.type === 'JSXAttribute')
    expect(jsxAttrHits.length).toBeGreaterThan(0)
  })

  it('skips strings inside t() calls', async () => {
    const appDir = path.join(tmpDir, 'app')
    await fs.promises.mkdir(appDir, { recursive: true })
    await fs.promises.writeFile(
      path.join(appDir, 'WithT.tsx'),
      `export function WithT() {
  return <p>{t('common.greeting')}</p>
}
`,
      'utf8',
    )

    const ctx = createContext(tmpDir)
    await scanStep(ctx)

    const filePath = path.join(appDir, 'WithT.tsx')
    const hits = ctx.stringHitsByFile.get(filePath) ?? []
    expect(hits.some((h) => h.value === "common.greeting")).toBe(false)
  })

  it('skips whitespace-only and single-char strings', async () => {
    const appDir = path.join(tmpDir, 'app')
    await fs.promises.mkdir(appDir, { recursive: true })
    await fs.promises.writeFile(
      path.join(appDir, 'Minimal.tsx'),
      `<div>   </div>`,
      'utf8',
    )

    const ctx = createContext(tmpDir)
    await scanStep(ctx)

    const filePath = path.join(appDir, 'Minimal.tsx')
    const hits = ctx.stringHitsByFile.get(filePath) ?? []
    expect(hits.filter((h) => !h.value.trim() || h.value.length === 1)).toHaveLength(0)
  })
})
