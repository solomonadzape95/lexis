'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Job } from '@/types'
import { createBrowserClient } from '@/lib/supabase'

type JobRealtimeContextValue = {
  /** Latest job data by id (from Realtime). Empty until first UPDATE. */
  jobById: Record<string, Job>
  /** Id we're currently subscribed to (so job page can avoid a second subscription). */
  subscribedJobId: string | null
  /** Start listening for job updates. Call this as soon as you have a jobId (e.g. before navigating to the job page). */
  subscribeToJob: (jobId: string) => void
}

const JobRealtimeContext = createContext<JobRealtimeContextValue | null>(null)

export function useJobRealtime() {
  const ctx = useContext(JobRealtimeContext)
  return ctx
}

type Props = { children: ReactNode }

export function JobRealtimeProvider({ children }: Props) {
  const [jobById, setJobById] = useState<Record<string, Job>>({})
  const [subscribedId, setSubscribedId] = useState<string | null>(null)

  const subscribeToJob = useCallback((jobId: string) => {
    setSubscribedId((prev) => (prev === jobId ? prev : jobId))
  }, [])

  useEffect(() => {
    if (!subscribedId) return

    let supabase: ReturnType<typeof createBrowserClient>
    try {
      supabase = createBrowserClient()
    } catch {
      return
    }
    const channel = supabase
      .channel(`job-realtime-${subscribedId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
          filter: `id=eq.${subscribedId}`,
        },
        (payload) => {
          setJobById((prev) => ({
            ...prev,
            [subscribedId]: payload.new as Job,
          }))
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
      setJobById((prev) => {
        const next = { ...prev }
        delete next[subscribedId]
        return next
      })
    }
  }, [subscribedId])

  const value: JobRealtimeContextValue = {
    jobById,
    subscribedJobId: subscribedId,
    subscribeToJob,
  }

  return (
    <JobRealtimeContext.Provider value={value}>
      {children}
    </JobRealtimeContext.Provider>
  )
}
