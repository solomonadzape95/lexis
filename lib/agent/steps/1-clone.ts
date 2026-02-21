import fs from 'node:fs'
import path from 'node:path'
import simpleGit from 'simple-git'
import type { PipelineContext } from '../types'
import { log } from '../logger'
import { getAdapter } from '../frameworks'
import { detectFrameworks, type DetectedFramework } from '@/lib/repo-detector'

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true })
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function validateNextAppRouter(repoDir: string): Promise<void> {
  const appDir = path.join(repoDir, 'app')
  const packageJsonPath = path.join(repoDir, 'package.json')

  const hasAppDir = await fileExists(appDir)
  const hasPackageJson = await fileExists(packageJsonPath)

  if (!hasAppDir || !hasPackageJson) {
    throw new Error('Currently supports Next.js App Router projects only.')
  }

  const pkgRaw = await fs.promises.readFile(packageJsonPath, 'utf8')
  const pkg = JSON.parse(pkgRaw) as { dependencies?: Record<string, string> }

  if (!pkg.dependencies || !pkg.dependencies.next) {
    throw new Error('No Next.js dependency found in package.json.')
  }
}

export default async function cloneStep(ctx: PipelineContext): Promise<void> {
  const { jobId, job, workDir, repoDir, githubToken } = ctx

  const startedAt = Date.now()
  await ensureDir(workDir)

  const git = simpleGit()

  const repoUrl = job.repo_url
  const cloneUrl =
    githubToken && repoUrl.startsWith('https://github.com/')
      ? repoUrl.replace('https://', `https://${githubToken}@`)
      : repoUrl

  await log(jobId, {
    step: 'clone',
    level: 'info',
    message: `Cloning ${repoUrl} into ${repoDir}`,
  })

  await git.clone(cloneUrl, repoDir, ['--depth', '1'])

  // Detect framework
  if (githubToken) {
    try {
      const match = repoUrl.match(/github\.com\/(.+?)\/(.+?)(?:\.git)?(?:\/)?$/)
      if (match) {
        const [, owner, repo] = match
        const frameworks = await detectFrameworks(owner, repo, githubToken)
        const supportedFramework = frameworks.find((f: DetectedFramework) => f.supported)
        
        if (supportedFramework) {
          ctx.detectedFramework = supportedFramework
          // Map framework to adapter key
          const adapterKey = supportedFramework.type === 'app-router' 
            ? 'nextjs-app-router'
            : `${supportedFramework.name.toLowerCase().replace(/\s+/g, '-')}-${supportedFramework.type}`
          const adapter = getAdapter(adapterKey)
          if (adapter) {
            ctx.frameworkAdapter = adapter
            await adapter.validate(repoDir)
          } else {
            // Fallback to Next.js App Router validation
            await validateNextAppRouter(repoDir)
          }
        } else {
          // Fallback to Next.js App Router validation
          await validateNextAppRouter(repoDir)
        }
      } else {
        // Fallback to Next.js App Router validation
        await validateNextAppRouter(repoDir)
      }
    } catch (error) {
      // If framework detection fails, fall back to Next.js App Router validation
      await validateNextAppRouter(repoDir)
    }
  } else {
    // Fallback to Next.js App Router validation
    await validateNextAppRouter(repoDir)
  }

  const durationMs = Date.now() - startedAt
  await log(jobId, {
    step: 'clone',
    level: 'success',
    message: `Cloned repository and validated framework in ${durationMs}ms`,
    data: { repoPath: repoDir, framework: ctx.detectedFramework?.name },
  })
}

