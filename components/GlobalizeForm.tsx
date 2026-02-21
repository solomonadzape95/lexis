'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LanguageSelector from './LanguageSelector'
import RepoDetector from './RepoDetector'
import Loader from './Loader'
import Icon from './Icon'

type Props = {
  initialRepoUrl?: string
  defaultLanguages?: string[]
  onSuccess?: (jobId: string) => void
  onError?: (error: string) => void
  className?: string
  showTitle?: boolean
  compact?: boolean
  githubToken?: string | null
}

export default function GlobalizeForm({
  initialRepoUrl = '',
  defaultLanguages = [],
  onSuccess,
  onError,
  className = '',
  showTitle = true,
  compact = false,
  githubToken: providedToken = null,
}: Props) {
  const [repoUrl, setRepoUrl] = useState(initialRepoUrl)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(defaultLanguages)
  const [githubToken, setGithubToken] = useState<string | null>(providedToken)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Fetch session to get GitHub token for RepoDetector if not provided
  useEffect(() => {
    if (providedToken) {
      setGithubToken(providedToken)
      return
    }
    
    fetch('/api/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.providerToken) {
          setGithubToken(data.providerToken)
        }
      })
      .catch(() => {
        // Ignore errors
      })
  }, [providedToken])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const repoUrl = formData.get('repoUrl') as string
    
    if (!repoUrl?.trim()) {
      setError('Repository URL is required.')
      return
    }
    
    if (selectedLanguages.length === 0) {
      setError('Please select at least one target language.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          languages: selectedLanguages,
        }),
      })

      const json = await res.json()
      
      if (!res.ok) {
        const message = json.details ?? json.error ?? 'Failed to create job.'
        setError(message)
        onError?.(message)
        return
      }

      const jobId = json.jobId
      onSuccess?.(jobId)
      router.push(`/jobs/${jobId}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create job.'
      setError(message)
      onError?.(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full max-w-[100%] ${compact ? 'sm:max-w-lg' : 'sm:max-w-2xl'} bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-10 shadow-2xl space-y-6 sm:space-y-8 ${className}`}
    >
      {showTitle && (
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Globalize Your Repository
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter your repository URL and select target languages
          </p>
        </div>
      )}

      {/* Repo URL Input */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Enter GitHub Repository URL
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
            <Icon name="link" size={20} />
          </div>
          <input
            id="repoUrl"
            name="repoUrl"
            required
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
            placeholder="https://github.com/username/nextjs-project"
            type="text"
          />
        </div>
        
        {/* Repo Detector – runs for any pasted URL (uses token if signed in for private repos) */}
        {repoUrl?.trim() && (
          <RepoDetector repoUrl={repoUrl.trim()} githubToken={githubToken} />
        )}
      </div>

      {/* Language Selector */}
      <LanguageSelector
        name="languages"
        defaultSelected={selectedLanguages}
        onChange={setSelectedLanguages}
      />

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
            <Icon name="error" size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary hover:bg-primary/90 text-white py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader size="default" className="shrink-0" />
            <span>Globalizing…</span>
          </>
        ) : (
          <>
            <svg
              aria-hidden="true"
              className="w-6 h-6 shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                fillRule="evenodd"
              />
            </svg>
            Globalize This Repo
          </>
        )}
      </button>
    </form>
  )
}
