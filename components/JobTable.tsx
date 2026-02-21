"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Job } from "@/types";
import { getLanguageByCode } from "@/lib/languages";
import Icon from "./Icon";
import Loader from "./Loader";
import JobCard from "./JobCard";

type Props = {
  jobs: Job[];
};

function getStatusBadge(job: Job) {
  switch (job.status) {
    case "completed":
      return {
        label: "Completed",
        className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      };
    case "running":
      return {
        label: "Running",
        className: "bg-primary/10 text-primary border-primary/20",
        pulse: true,
      };
    case "failed":
      return {
        label: "Failed",
        className: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      };
    default:
      return {
        label: "Pending",
        className:
          "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700",
      };
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function JobTable({ jobs }: Props) {
  const router = useRouter();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleRetry = async (e: React.MouseEvent, jobId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setRetryingId(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/run`, { method: "POST" });
      const data = (await res.json()) as { started?: boolean; error?: string };
      if (res.ok && data.started) {
        router.push(`/jobs/${jobId}`);
      } else {
        router.refresh();
      }
    } finally {
      setRetryingId(null);
    }
  };

  // Mobile: use cards (handled via CSS)
  return (
    <>
      {/* Mobile: Cards */}
      <div className="md:hidden space-y-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onRetry={handleRetry} retryingId={retryingId} />
        ))}
      </div>
      {/* Desktop: Table */}
      <div className="hidden md:block bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm min-w-0">
        <div className="overflow-x-auto min-w-0">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Repository
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Last Run
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Target Languages
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {jobs.map((job) => {
                const statusBadge = getStatusBadge(job);
                return (
                  <tr
                    key={job.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                          <Icon
                            name="account_tree"
                            size={18}
                            className="text-primary"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                            {job.repo_owner}/{job.repo_name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {job.repo_url}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(job.updated_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {statusBadge.pulse && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {job.languages.slice(0, 5).map((lang) => {
                          const info = getLanguageByCode(lang);
                          return (
                            <span
                              key={lang}
                              className="text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full inline-flex items-center gap-1"
                              title={info?.name ?? lang}
                            >
                              {info?.flag ?? lang.toUpperCase()}
                            </span>
                          );
                        })}
                        {job.languages.length > 5 && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            +{job.languages.length - 5}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(job.status === "failed" || job.status === "cancelled") && (
                          <button
                            type="button"
                            onClick={(e) => handleRetry(e, job.id)}
                            disabled={retryingId === job.id}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 disabled:opacity-50"
                          >
                            {retryingId === job.id ? (
                              <Loader size="sm" />
                            ) : (
                              <Icon name="refresh" size={16} />
                            )}
                            Retry
                          </button>
                        )}
                        <Link
                          href={`/jobs/${job.id}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          View
                          <Icon name="arrow_forward_ios" size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
