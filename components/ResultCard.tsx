import Link from 'next/link'
import type { Job } from '@/types'

type Props = {
  job: Job
}

export default function ResultCard({ job }: Props) {
  const isDone = job.status === 'completed'
  const isFailed = job.status === 'failed'
  const isCancelled = job.status === 'cancelled'

  return (
    <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 shadow shadow-slate-950/40 min-w-0 overflow-hidden">
      <h2 className="text-xs sm:text-sm font-semibold text-slate-100">Result</h2>
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 text-sm text-slate-300">
          <div className="inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
            <span
              className={
                isDone
                  ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/5'
                  : isFailed
                    ? 'text-rose-400 border-rose-500/40 bg-rose-500/5'
                    : isCancelled
                      ? 'text-amber-400 border-amber-500/40 bg-amber-500/5'
                      : 'text-sky-400 border-sky-500/40 bg-sky-500/5'
              }
            >
              {job.status}
            </span>
          </div>

          {job.error && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-rose-300">
                {isFailed ? 'Job failed while opening the pull request.' : 'Error'}
              </p>
              <p className="text-xs text-rose-200/80 break-words">
                {job.error}
              </p>
            </div>
          )}
        </div>

        {isDone && job.pr_url && (
          <Link
            href={job.pr_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 shadow transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
          >
            View pull request →
          </Link>
        )}
      </div>
    </section>
  )
}

