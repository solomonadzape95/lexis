import { describe, it, expect, vi, beforeEach } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import { mkdtempSync } from 'node:fs'
import setupI18nStep from '@/lib/agent/steps/3-setup-i18n'
import type { PipelineContext } from '@/lib/agent/types'
import type { Job } from '@/types'

vi.mock('@/lib/agent/logger', () => ({
  log: vi.fn(),
}))

function createContext(repoDir: string, targetLanguages: string[]): PipelineContext {
  return {
    job: {} as Job,
    jobId: 'test',
    workDir: '',
    repoDir,
    supabase: {} as any,
    octokit: {} as any,
    stats: { filesModified: 0, stringsFound: 0, languagesAdded: 0 },
    stringHitsByFile: new Map(),
    enMessages: {},
    targetLanguages,
  }
}

describe('setupI18nStep', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(tmpdir(), 'setup-i18n-test-'))
  })

  it('writes i18n.json with correct schema and target languages', async () => {
    const appDir = path.join(tmpDir, 'app')
    await fs.promises.mkdir(appDir, { recursive: true })
    await fs.promises.writeFile(path.join(appDir, 'layout.tsx'), 'export default function Layout({ children }) { return children }', 'utf8')
    await fs.promises.writeFile(path.join(appDir, 'page.tsx'), 'export default function Page() { return <div>Hi</div> }', 'utf8')

    const ctx = createContext(tmpDir, ['es', 'fr'])
    await setupI18nStep(ctx)

    const i18nPath = path.join(tmpDir, 'i18n.json')
    const i18n = JSON.parse(await fs.promises.readFile(i18nPath, 'utf8'))
    expect(i18n.$schema).toBe('https://lingo.dev/schema/i18n.json')
    expect(i18n.version).toBe('1.10')
    expect(i18n.locale.source).toBe('en')
    expect(i18n.locale.targets).toEqual(['es', 'fr'])
    expect(i18n.buckets.json.include).toContain('messages/[locale].json')
  })

  it('creates messages/en.json when missing', async () => {
    const appDir = path.join(tmpDir, 'app')
    await fs.promises.mkdir(appDir, { recursive: true })
    await fs.promises.writeFile(path.join(appDir, 'layout.tsx'), '', 'utf8')
    await fs.promises.writeFile(path.join(appDir, 'page.tsx'), '', 'utf8')

    const ctx = createContext(tmpDir, ['es'])
    await setupI18nStep(ctx)

    const enPath = path.join(tmpDir, 'messages', 'en.json')
    const en = JSON.parse(await fs.promises.readFile(enPath, 'utf8'))
    expect(en).toEqual({})
  })

  it('moves app/layout.tsx and app/page.tsx to app/[locale]/', async () => {
    const appDir = path.join(tmpDir, 'app')
    await fs.promises.mkdir(appDir, { recursive: true })
    const layoutContent = 'export default function Layout({ children }) { return children }'
    const pageContent = 'export default function Page() { return <div>Hi</div> }'
    await fs.promises.writeFile(path.join(appDir, 'layout.tsx'), layoutContent, 'utf8')
    await fs.promises.writeFile(path.join(appDir, 'page.tsx'), pageContent, 'utf8')

    const ctx = createContext(tmpDir, ['es'])
    await setupI18nStep(ctx)

    const localeDir = path.join(appDir, '[locale]')
    const newLayout = await fs.promises.readFile(path.join(localeDir, 'layout.tsx'), 'utf8')
    const newPage = await fs.promises.readFile(path.join(localeDir, 'page.tsx'), 'utf8')
    expect(newLayout).toBe(layoutContent)
    expect(newPage).toBe(pageContent)

    await expect(fs.promises.access(path.join(appDir, 'layout.tsx'))).rejects.toThrow()
    await expect(fs.promises.access(path.join(appDir, 'page.tsx'))).rejects.toThrow()
  })
})
