import path from 'node:path'
import simpleGit from 'simple-git'
import type { PipelineContext } from '../types'
import { log } from '../logger'

const branchName = 'feat/i18n-lingo-dev'

export default async function commitPushStep(ctx: PipelineContext): Promise<void> {
  const { job, jobId, repoDir, octokit, githubUsername, githubToken } = ctx

  const owner = job.repo_owner
  const repo = job.repo_name

  const forkOwner =
    githubUsername ?? process.env.GITHUB_BOT_USERNAME ?? 'i18n-agent-bot'

  if (githubToken && !githubUsername) {
    await log(jobId, {
      step: 'commit-push',
      level: 'error',
      message: 'GitHub identity required for push. Sign in with GitHub.',
    })
    throw new Error('GitHub identity required for push.')
  }

  const isOwnRepo = forkOwner === owner

  await log(jobId, {
    step: 'commit-push',
    level: 'info',
    message: isOwnRepo
      ? `Repository is owned by ${forkOwner}. Will push directly to new branch (no fork needed).`
      : `Creating fork ${owner}/${repo} → ${forkOwner}/${repo}...`,
  })

  const git = simpleGit({ baseDir: repoDir })

  let pushTarget: { remote: string; repo: string; owner: string }

  if (isOwnRepo) {
    // User owns the repo - push directly to origin (no fork needed)
    pushTarget = { remote: 'origin', repo, owner: forkOwner }
    
    // Update origin remote to use token for authenticated push
    const originUrl = githubToken
      ? `https://${githubToken}@github.com/${owner}/${repo}.git`
      : `https://github.com/${owner}/${repo}.git`
    
    await log(jobId, {
      step: 'commit-push',
      level: 'info',
      message: `Updating origin remote URL (token ${githubToken ? 'present' : 'missing'})...`,
    })
    
    await git.removeRemote('origin').catch(() => {})
    await git.addRemote('origin', originUrl)
    
    // Verify remote was set correctly
    const remotes = await git.getRemotes(true)
    const originRemote = remotes.find((r) => r.name === 'origin')
    await log(jobId, {
      step: 'commit-push',
      level: 'info',
      message: `Origin remote configured: ${originRemote?.refs?.fetch ?? 'not found'}`,
    })
    
    await log(jobId, {
      step: 'commit-push',
      level: 'info',
      message: `Using origin remote for direct push (own repo: ${owner}/${repo}).`,
    })
  } else {
    // Not user's repo - create fork (fork will be under user's account, identifiable by owner)
    try {
      // Check if fork already exists
      await octokit.repos.get({ owner: forkOwner, repo })
      await log(jobId, {
        step: 'commit-push',
        level: 'info',
        message: `Fork ${forkOwner}/${repo} already exists.`,
      })
    } catch {
      // Fork doesn't exist, create it
      try {
        await log(jobId, {
          step: 'commit-push',
          level: 'info',
          message: `Creating fork...`,
        })
        const forkResult = await octokit.repos.createFork({ owner, repo })
        
        // Wait for fork to be ready (GitHub forks are async)
        await log(jobId, {
          step: 'commit-push',
          level: 'info',
          message: `Fork creation initiated. Waiting for fork to be ready...`,
        })
        
        // Poll until fork is ready (max 30 seconds)
        let attempts = 0
        while (attempts < 15) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
          try {
            await octokit.repos.get({ owner: forkOwner, repo })
            await log(jobId, {
              step: 'commit-push',
              level: 'info',
              message: `Fork ${forkOwner}/${repo} is ready.`,
            })
            break
          } catch {
            attempts++
          }
        }
      } catch (forkError: any) {
        // 422 means fork already exists or can't be created
        if (forkError?.status === 422) {
          await log(jobId, {
            step: 'commit-push',
            level: 'info',
            message: `Fork may already exist or cannot be created. Continuing...`,
          })
        } else {
          await log(jobId, {
            step: 'commit-push',
            level: 'error',
            message: `Failed to create fork: ${forkError?.message ?? String(forkError)}`,
          })
          throw forkError
        }
      }
    }
    
    pushTarget = { remote: 'fork', repo, owner: forkOwner }
    
    // Set up fork remote
    const remotes = await git.getRemotes(true)
    const hasForkRemote = remotes.some((r) => r.name === 'fork')
    if (!hasForkRemote) {
      const forkUrl = githubToken
        ? `https://${githubToken}@github.com/${forkOwner}/${repo}.git`
        : `https://github.com/${forkOwner}/${repo}.git`
      await git.addRemote('fork', forkUrl)
    } else {
      // Update existing fork remote to use token
      const forkUrl = githubToken
        ? `https://${githubToken}@github.com/${forkOwner}/${repo}.git`
        : `https://github.com/${forkOwner}/${repo}.git`
      await git.removeRemote('fork')
      await git.addRemote('fork', forkUrl)
    }
  }

  await git.add('.')

  await git.raw(['config', 'user.name', githubUsername ?? forkOwner])
  await git.raw([
    'config',
    'user.email',
    githubUsername ? `${githubUsername}@users.noreply.github.com` : 'agent@lexis.app',
  ])

  const author = githubUsername
    ? `${githubUsername} <${githubUsername}@users.noreply.github.com>`
    : `${forkOwner}[bot] <bot@example.com>`

  await git.commit('feat: add i18n support via Lingo.dev', undefined, {
    '--author': author,
  })

  // Verify we have the right remote before pushing
  const remotesBeforePush = await git.getRemotes(true)
  const targetRemote = remotesBeforePush.find((r) => r.name === pushTarget.remote)
  
  await log(jobId, {
    step: 'commit-push',
    level: 'info',
    message: `Pushing to ${pushTarget.remote}:${branchName}...`,
    data: {
      remote: pushTarget.remote,
      remoteUrl: targetRemote?.refs?.fetch ?? 'not found',
      targetRepo: `${pushTarget.owner}/${pushTarget.repo}`,
      branch: branchName,
      hasToken: !!githubToken,
    },
  })

  try {
    await git.push(pushTarget.remote, `HEAD:${branchName}`, ['--force'])
  } catch (pushError: any) {
    const errorMessage = pushError?.message ?? String(pushError)
    const errorDetails = {
      error: errorMessage,
      remote: pushTarget.remote,
      remoteUrl: targetRemote?.refs?.fetch ?? 'not found',
      targetRepo: `${pushTarget.owner}/${pushTarget.repo}`,
      branch: branchName,
      hasToken: !!githubToken,
      isOwnRepo,
    }
    
    await log(jobId, {
      step: 'commit-push',
      level: 'error',
      message: `Push failed: ${errorMessage}`,
      data: errorDetails,
    })
    
    // Log additional diagnostic info
    await log(jobId, {
      step: 'commit-push',
      level: 'error',
      message: `Diagnostics: remote=${pushTarget.remote}, repo=${pushTarget.owner}/${pushTarget.repo}, token=${githubToken ? 'present' : 'missing'}, ownRepo=${isOwnRepo}`,
    })
    
    throw new Error(`Failed to push: ${errorMessage}`)
  }

  await log(jobId, {
    step: 'commit-push',
    level: 'success',
    message: `Pushed changes to ${pushTarget.owner}/${pushTarget.repo} on branch ${branchName}.`,
    data: { branch: branchName, repo: `${pushTarget.owner}/${pushTarget.repo}` },
  })
}
