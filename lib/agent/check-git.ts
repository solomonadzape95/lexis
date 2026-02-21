import simpleGit from 'simple-git'

const GIT_REQUIRED_MESSAGE =
  'Git is not installed in this environment. The pipeline needs Git to clone and push repositories. ' +
  'Deploy to a platform that includes Git (e.g. Railway, Fly.io, Render, or a Docker image with git installed). ' +
  'Serverless runtimes like Vercel do not include Git by default.'

/**
 * Ensures the system `git` binary is available (used by simple-git).
 * Call at pipeline start to fail fast with a clear message in production.
 */
export async function ensureGitAvailable(): Promise<void> {
  const git = simpleGit()
  try {
    await git.version()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : ''
    if (code === 'ENOENT' || (msg.includes('spawn git') && (msg.includes('ENOENT') || msg.includes('not found')))) {
      throw new Error(GIT_REQUIRED_MESSAGE)
    }
    throw err
  }
}
