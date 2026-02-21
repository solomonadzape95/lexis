'use server'

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/supabase-server'

export async function createJob(formData: FormData): Promise<{ jobId: string } | { error: string }> {
  const session = await getSession()
  if (!session) {
    return { error: 'Sign in required. Sign in with GitHub to run the pipeline.' }
  }

  if (!session.providerToken) {
    return { error: 'GitHub token required. Please sign in again.' }
  }

  const repoUrl = formData.get('repoUrl') as string | null
  const languages = formData.getAll('languages') as string[]

  if (!repoUrl?.trim()) {
    return { error: 'Repository URL is required.' }
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT || 3000}`)
  
  const res = await fetch(`${baseUrl}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repoUrl: repoUrl.trim(),
      languages,
      userId: session.user.id,
      githubToken: session.providerToken,
      githubUsername: session.githubUsername,
    }),
  })

  const json = (await res.json()) as {
    jobId?: string
    error?: string
    details?: string
  }
  
  if (!res.ok) {
    const message = json.details ?? json.error ?? 'Failed to create job.'
    return { error: message }
  }

  const data = json as { jobId: string }
  redirect(`/jobs/${data.jobId}`)
}
