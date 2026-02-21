"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Job } from "@/types";
import { getLanguageByCode } from "@/lib/languages";
import Icon from "./Icon";
import Loader from "./Loader";

type Props = {
  job: Job;
  onRetry?: (e: React.MouseEvent, jobId: string) => void;
  retryingId?: string | null;
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

export default function JobCard({ job, onRetry, retryingId }: Props) {
  const statusBadge = getStatusBadge(job);
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRetry) {
      onRetry(e, job.id);
      return;
    }
    setRetrying(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/run`, { method: "POST" });
      const data = (await res.json()) as { started?: boolean };
      if (res.ok && data.started) {
        router.refresh();
      }
    } finally {
      setRetrying(false);
    }
  };

  const showRetry = (job.status === "failed" || job.status === "cancelled") && (onRetry || true);

  return (
    <div className="block bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
      <Link href={`/jobs/${job.id}`} className="block focus:outline-none">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg shrink-0">
            <Icon name="account_tree" size={20} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 dark:text-white truncate">
              {job.repo_owner}/{job.repo_name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {formatDate(job.updated_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
      </div>

      <div className="flex items-center gap-2 flex-wrap">
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
            +{job.languages.length - 5} more
          </span>
        )}
      </div>
      </Link>
      {showRetry && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying || retryingId === job.id}
            className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 disabled:opacity-50"
          >
            {(retrying || retryingId === job.id) ? (
              <Loader size="sm" />
            ) : (
              <Icon name="refresh" size={18} />
            )}
            Retry job
          </button>
        </div>
      )}
    </div>
  );
}
