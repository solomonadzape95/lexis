'use client'

import { useState, useEffect } from 'react'
import type { DetectedFramework } from '@/lib/repo-detector'
import Icon from './Icon'
import FrameworkIcon from './FrameworkIcon'

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
    if (!repoUrl?.trim()) {
      setFrameworks([])
      return
    }

    const normalized = repoUrl.trim().replace(/^https?:\/\//, '').split('?')[0]
    const match = normalized.match(/github\.com\/([^/]+)\/([^/#]+?)(?:\.git)?(?:\/.*)?$/)
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
        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-800 shadow-sm ring-1 ring-emerald-500/20">
            <FrameworkIcon
              name={supportedFramework.name}
              type={supportedFramework.type}
              size={22}
              className="[color:inherit]"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {supportedFramework.name}
              {supportedFramework.type && supportedFramework.type !== 'unknown' && (
                <span className="font-normal text-emerald-600 dark:text-emerald-500"> ({supportedFramework.type})</span>
              )}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
              Fully supported
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-500/20 p-1.5" aria-hidden>
            <Icon name="check_circle" size={16} className="text-emerald-600 dark:text-emerald-400" />
          </span>
        </div>
      )}

      {unsupportedFrameworks.map((framework) => (
        <div
          key={`${framework.name}-${framework.type}`}
          className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600">
            <FrameworkIcon
              name={framework.name}
              type={framework.type}
              size={22}
              className="text-slate-600 dark:text-slate-400"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {framework.name}
              {framework.type && framework.type !== 'unknown' && (
                <span className="font-normal text-slate-500 dark:text-slate-400"> ({framework.type})</span>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
