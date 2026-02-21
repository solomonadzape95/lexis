import { spawn } from 'node:child_process'
import path from 'node:path'
import type { PipelineContext } from '../types'
import { log } from '../logger'

const lingoApiKey = process.env.LINGODOTDEV_API_KEY

export default async function translateStep(ctx: PipelineContext): Promise<void> {
  const { jobId, repoDir, stats, targetLanguages } = ctx

  if (!lingoApiKey) {
    await log(jobId, {
      step: 'translate',
      level: 'warning',
      message:
        'LINGODOTDEV_API_KEY is not set; skipping Lingo.dev CLI translation step.',
    })
    return
  }

  await log(jobId, {
    step: 'translate',
    level: 'info',
    message: 'Running Lingo.dev CLI to generate translated locale files.',
  })

  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'

  const child = spawn(cmd, ['lingo.dev@latest', 'i18n'], {
    cwd: repoDir,
    env: {
      ...process.env,
      LINGODOTDEV_API_KEY: lingoApiKey,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let stdoutBuf = ''
  let stderrBuf = ''

  child.stdout.on('data', (chunk) => {
    const text = String(chunk)
    stdoutBuf += text
  })

  child.stderr.on('data', (chunk) => {
    const text = String(chunk)
    stderrBuf += text
  })

  const exitCode: number = await new Promise((resolve, reject) => {
    child.on('error', (err) => reject(err))
    child.on('close', (code) => resolve(code ?? 1))
  })

  if (exitCode !== 0) {
    await log(jobId, {
      step: 'translate',
      level: 'error',
      message: `Lingo.dev CLI failed with code ${exitCode}: ${stderrBuf || stdoutBuf}`,
    })
    throw new Error(`Lingo.dev CLI failed with code ${exitCode}`)
  }

  // Simple heuristic: languagesAdded = number of target languages
  ctx.stats = {
    ...stats,
    languagesAdded: stats.languagesAdded + targetLanguages.length,
  }

  await log(jobId, {
    step: 'translate',
    level: 'success',
    message: `Translated locale files for ${targetLanguages.length} languages via Lingo.dev.`,
    data: { languagesCount: targetLanguages.length },
  })
}

