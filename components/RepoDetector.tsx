'use client'

import { useState, useEffect } from 'react'
import type { DetectedFramework } from '@/lib/repo-detector'
import Icon from './Icon'

type Props = {
  repoUrl: string
  githubToken: string | null
  onDetected?: (frameworks: DetectedFramework[]) => void
}

export default function RepoDetector({ repoUrl, githubToken, onDetected }: Props) {
  const [frameworks, setFrameworks] = useState<DetectedFramework[]>([])
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!repoUrl || !githubToken) {
      setFrameworks([])
      return
    }

    const match = repoUrl.match(/github\.com\/(.+?)\/(.+?)(?:\.git)?(?:\/)?$/)
    if (!match) {
      setFrameworks([])
      return
    }

    const [, owner, repo] = match

    setIsDetecting(true)
    setError(null)

    fetch('/api/repo/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, repo }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
          setFrameworks([])
        } else {
          setFrameworks(data.frameworks || [])
          onDetected?.(data.frameworks || [])
        }
      })
      .catch((err) => {
        setError(err.message)
        setFrameworks([])
      })
      .finally(() => {
        setIsDetecting(false)
      })
  }, [repoUrl, githubToken, onDetected])

  if (!repoUrl) return null

  if (isDetecting) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Icon name="refresh" size={16} className="animate-spin" />
        <span>Detecting framework...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
        <Icon name="error" size={16} />
        <span>Could not detect framework: {error}</span>
      </div>
    )
  }

  if (frameworks.length === 0) return null

  const supportedFramework = frameworks.find((f) => f.supported)
  const unsupportedFrameworks = frameworks.filter((f) => !f.supported)

  return (
    <div className="space-y-2">
      {supportedFramework && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <Icon name="check_circle" size={20} className="text-emerald-500" />
          <div className="flex-1">
            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {supportedFramework.name}
              {supportedFramework.type && ` (${supportedFramework.type})`}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-500">
              Fully supported ✓
            </div>
          </div>
        </div>
      )}

      {unsupportedFrameworks.map((framework) => (
        <div
          key={`${framework.name}-${framework.type}`}
          className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
        >
          <Icon name="schedule" size={20} className="text-amber-500" />
          <div className="flex-1">
            <div className="text-sm font-bold text-amber-700 dark:text-amber-400">
              {framework.name}
              {framework.type && ` (${framework.type})`}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-500">
              {framework.supportLevel === 'coming-soon'
                ? 'Coming soon'
                : 'Not supported'}
            </div>
          </div>
        </div>
      ))}

      {frameworks.length > 0 && !supportedFramework && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
          <div className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-1">
            Framework Not Supported
          </div>
          <div className="text-xs text-rose-600 dark:text-rose-500">
            Currently, only Next.js App Router projects are supported. Support for other
            frameworks is coming soon!
          </div>
        </div>
      )}
    </div>
  )
}
