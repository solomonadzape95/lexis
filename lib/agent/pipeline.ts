import { Octokit } from '@octokit/rest'
import { createClient } from '@supabase/supabase-js'
import type { Job, JobStats } from '../../types'
import type { PipelineContext, PipelineStep, PipelineStepName } from './types'
import { log, setCurrentStep, setStatus } from './logger'
import cloneStep from './steps/1-clone'
import scanStep from './steps/2-scan'
import setupI18nStep from './steps/3-setup-i18n'
import transformStep from './steps/4-transform'
import translateStep from './steps/5-translate'
import commitPushStep from './steps/6-commit-push'
import openPrStep from './steps/7-open-pr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase URL or service role key is not set for agent pipeline.')
}

const stepMap: Record<PipelineStepName, PipelineStep> = {
  clone: cloneStep,
  scan: scanStep,
  'setup-i18n': setupI18nStep,
  transform: transformStep,
  translate: translateStep,
  'commit-push': commitPushStep,
  'open-pr': openPrStep,
}

const orderedSteps: PipelineStepName[] = [
  'clone',
  'scan',
  'transform',
  'setup-i18n',
  'translate',
  'commit-push',
  'open-pr',
]

function createInitialStats(): JobStats {
  return {
    filesModified: 0,
    stringsFound: 0,
    languagesAdded: 0,
  }
}

export type RunPipelineOptions = {
  githubToken?: string
  githubUsername?: string
}

export async function runPipeline(
  job: Job,
  options?: RunPipelineOptions,
): Promise<void> {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase environment variables are not configured.')
  }

  const token = options?.githubToken ?? process.env.GITHUB_TOKEN
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
  const octokit = new Octokit({
    auth: token ?? undefined,
  })

  const jobId = job.id
  const workDir = `/tmp/spokesperson/${jobId}`
  const repoDir = `${workDir}/repo`

  const ctx: PipelineContext = {
    job,
    jobId,
    workDir,
    repoDir,
    supabase,
    octokit,
    githubUsername: options?.githubUsername ?? job.github_username ?? null,
    githubToken: options?.githubToken ?? null,
    stats: createInitialStats(),
    stringHitsByFile: new Map(),
    enMessages: {},
    targetLanguages: job.languages && job.languages.length > 0
      ? job.languages
      : ['es', 'fr', 'de', 'ja', 'zh'],
  }

  await setStatus(jobId, 'running')

  try {
    for (const stepName of orderedSteps) {
      const { data: jobRow } = await supabase
        .from('jobs')
        .select('status')
        .eq('id', jobId)
        .single()
      if ((jobRow as { status?: string } | null)?.status === 'cancelled') {
        await log(jobId, {
          step: 'pipeline',
          level: 'info',
          message: 'Pipeline cancelled by user.',
        })
        await setCurrentStep(jobId, null)
        return
      }

      const step = stepMap[stepName]
      const startedAt = Date.now()

      await setCurrentStep(jobId, stepName)
      await log(jobId, {
        step: stepName,
        level: 'info',
        message: `Starting step: ${stepName}`,
      })

      await step(ctx)

      const durationMs = Date.now() - startedAt
      await log(jobId, {
        step: stepName,
        level: 'success',
        message: `Completed step: ${stepName} in ${durationMs}ms`,
      })
    }

    await setCurrentStep(jobId, null)
    await setStatus(jobId, 'completed')
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error in pipeline.'

    await log(jobId, {
      step: 'pipeline',
      level: 'error',
      message,
    })

    await setStatus(jobId, 'failed', message)
    await setCurrentStep(jobId, null)

    throw err
  }
}

