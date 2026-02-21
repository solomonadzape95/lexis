"use client";

import { useCallback, useEffect, useState } from "react";
import type { Job } from "@/types";
import { createBrowserClient } from "@/lib/supabase";
import { useJobRealtime } from "./JobRealtimeProvider";
import { getStepSummary } from "@/lib/stepSummary";
import StepRow from "./StepRow";
import ResultCard from "./ResultCard";
import ProcessLogs from "./ProcessLogs";
import Icon from "./Icon";
import Loader from "./Loader";

type Props = {
  initialJob: Job;
};

const STEPS = [
  { id: "clone", label: "Clone" },
  { id: "scan", label: "Scan" },
  { id: "transform", label: "Transform" },
  { id: "setup-i18n", label: "Setup" },
  { id: "translate", label: "Translate" },
  { id: "commit-push", label: "Commit & Push" },
  { id: "open-pr", label: "Pull Request" },
] as const;

export default function JobProgress({ initialJob }: Props) {
  const realtime = useJobRealtime();
  const realtimeJob = realtime?.jobById[initialJob.id];

  const [job, setJob] = useState<Job>(realtimeJob ?? initialJob);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Sync with provider when it has newer data (e.g. we subscribed before navigation)
  useEffect(() => {
    if (realtimeJob) setJob(realtimeJob);
  }, [realtimeJob]);

  // Only create our own Realtime subscription when the provider isn't subscribed to this job (e.g. direct load / refresh)
  const useProviderSubscription = realtime?.subscribedJobId === initialJob.id;
  useEffect(() => {
    if (useProviderSubscription) return;

    let supabase: ReturnType<typeof createBrowserClient>;
    try {
      supabase = createBrowserClient();
    } catch {
      return;
    }

    const channel = supabase
      .channel(`job-${initialJob.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${initialJob.id}`,
        },
        (payload) => {
          setJob(payload.new as Job);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [initialJob.id, useProviderSubscription]);

  // One-time hydration to pick up logs/steps that may have been written
  // before this client subscribed to Realtime.
  useEffect(() => {
    if (hasHydrated) return;

    const shouldHydrate =
      (job.logs ?? []).length === 0 &&
      (job.status !== "pending" || job.current_step !== null || !!job.error);

    if (!shouldHydrate) {
      setHasHydrated(true);
      return;
    }

    const hydrate = async () => {
      try {
        const res = await fetch(`/api/jobs/${job.id}`);
        if (!res.ok) {
          setHasHydrated(true);
          return;
        }
        const latest = (await res.json()) as Job;
        setJob(latest);
      } catch {
        // ignore hydration errors
      } finally {
        setHasHydrated(true);
      }
    };

    void hydrate();
  }, [job.id, job.logs, job.status, job.current_step, job.error, hasHydrated]);

  // Delayed refetch: pipeline often starts before we land on this page, so the WebSocket
  // may not be connected when early logs are written. Refetch once after a short delay
  // to catch any logs we missed before the subscription was active.
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/jobs/${job.id}`);
        if (!res.ok) return;
        const latest = (await res.json()) as Job;
        setJob((prev) => {
          const prevLogCount = (prev.logs ?? []).length;
          const newLogCount = (latest.logs ?? []).length;
          return newLogCount > prevLogCount ? latest : prev;
        });
      } catch {
        // ignore
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [job.id]);

  const handleStart = useCallback(async () => {
    if (job.status !== "pending" || isStarting) return;
    setIsStarting(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/run`, { method: "POST" });
      const data = (await res.json()) as {
        started?: boolean;
        message?: string;
      };
      if (res.ok && data.started) {
        setJob((prev) => ({ ...prev, status: "running" }));
      }
    } finally {
      setIsStarting(false);
    }
  }, [job.id, job.status, isStarting]);

  const handleStop = useCallback(async () => {
    if (job.status !== "running" || isStopping) return;
    setIsStopping(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/stop`, { method: "POST" });
      const data = (await res.json()) as { stopped?: boolean; error?: string };
      if (res.ok && data.stopped) {
        setJob((prev) => ({
          ...prev,
          status: "cancelled",
          current_step: null,
          error: "Cancelled by user.",
        }));
      }
    } finally {
      setIsStopping(false);
    }
  }, [job.id, job.status, isStopping]);

  const showStart = job.status === "pending";
  const showStop = job.status === "running";
  const showRetry = job.status === "failed" || job.status === "cancelled";

  const handleRetry = useCallback(async () => {
    if (!showRetry || isStarting) return;
    setIsStarting(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/run`, { method: "POST" });
      const data = (await res.json()) as { started?: boolean; message?: string };
      if (res.ok && data.started) {
        setJob((prev) => ({ ...prev, status: "running" }));
      }
    } finally {
      setIsStarting(false);
    }
  }, [job.id, showRetry, isStarting]);

  const completedSteps = STEPS.filter((step) => {
    const logsForStep = (job.logs ?? []).filter((log) => log.step === step.id);
    return logsForStep.some((log) => log.level === "success");
  }).length;

  // Calculate effective progress including running step
  const effectiveSteps = completedSteps + (job.current_step ? 0.5 : 0);
  const progressPercentage = (effectiveSteps / STEPS.length) * 100;

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Repository Summary Card */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
            <Icon name="account_tree" className="text-primary" size={28} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-sm sm:text-base font-bold dark:text-white truncate">
                {job.repo_owner}/{job.repo_name}
              </h2>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-widest">
                Public
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Icon name="account_tree" size={16} />
                main
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="language" size={16} />
                en-US (Source)
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="translate" size={16} />
                {job.languages.length} Target Locales
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {(showStart || showStop || showRetry) && (
            <>
              {showStart && (
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={isStarting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary/90 text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isStarting ? (
                    <>
                      <Loader size="sm" />
                      Starting…
                    </>
                  ) : (
                    <>
                      <Icon name="play_circle" size={20} />
                      Start Globalization
                    </>
                  )}
                </button>
              )}
              {showRetry && (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isStarting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isStarting ? (
                    <>
                      <Loader size="sm" />
                      Retrying…
                    </>
                  ) : (
                    <>
                      <Icon name="refresh" size={20} />
                      Retry
                    </>
                  )}
                </button>
              )}
              {showStop && (
                <button
                  type="button"
                  onClick={handleStop}
                  disabled={isStopping}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-bold shadow-lg shadow-rose-500/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isStopping ? (
                    <>
                      <Loader size="sm" />
                      Stopping…
                    </>
                  ) : (
                    <>
                      <Icon name="stop_circle" size={20} />
                      Stop
                    </>
                  )}
                </button>
              )}
            </>
          )}
          <a
            href={job.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors w-full sm:w-auto order-first sm:order-none"
          >
            <Icon name="open_in_new" size={18} />
            View Repository
          </a>
        </div>
      </div>

      {/* Two-column layout: stack on small, side-by-side on large */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0 overflow-hidden">
        {/* Left: Job Progress Stepper */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 min-h-[200px] lg:min-h-0">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold dark:text-white">Job Progress</h3>
            <span className="text-sm font-medium text-primary">
              {completedSteps} / {STEPS.length} Completed
            </span>
          </div>
          <div className="flex-1 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl p-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-0 relative">
              {/* Vertical Line */}
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800" />
              <div
                className="absolute left-4 top-4 w-0.5 bg-primary/40 transition-all duration-300"
                style={{ height: `${progressPercentage}%` }}
              />

              {STEPS.map((step, index) => (
                <StepRow
                  key={step.id}
                  index={index + 1}
                  stepId={step.id}
                  label={step.label}
                  job={job}
                  summary={getStepSummary(job, step.id)}
                  isLast={index === STEPS.length - 1}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Console Logs Terminal */}
        <div className="w-full lg:flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
          <ProcessLogs logs={job.logs ?? []} />
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:px-6">
        <div className="flex items-center gap-4 min-w-0">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
            Agent is performing actions as{" "}
            <span className="font-bold text-slate-900 dark:text-slate-200">
              {job.github_username ?? "i18n-bot"}
            </span>
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {showStop && (
            <button
              type="button"
              onClick={handleStop}
              disabled={isStopping}
              className="px-5 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Cancel Job
            </button>
          )}
          {job.pr_url ? (
            <a
              href={job.pr_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-primary hover:bg-primary/90 text-white rounded-lg transition-all shadow-lg shadow-primary/20"
            >
              <Icon name="open_in_new" size={18} />
              View Pull Request
            </a>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-lg cursor-not-allowed border border-slate-200 dark:border-slate-700"
            >
              View Pull Request
            </button>
          )}
        </div>
      </div>

      <ResultCard job={job} />
    </div>
  );
}
