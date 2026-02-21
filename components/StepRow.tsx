"use client";

import type { Job } from "@/types";
import Icon from "./Icon";

type Props = {
  index: number;
  stepId: string;
  label: string;
  job: Job;
  summary?: string | null;
  isLast?: boolean;
};

function getStepStatus(stepId: string, job: Job) {
  const logsForStep = (job.logs ?? []).filter((log) => log.step === stepId);
  const hasError = logsForStep.some((log) => log.level === "error");
  const hasSuccess = logsForStep.some((log) => log.level === "success");

  // If this step logged an error, consider it failed
  if (hasError) {
    return "failed";
  }

  // If the overall job failed and the user is on this step, also show failed
  if (job.status === "failed" && job.current_step === stepId) {
    return "failed";
  }

  if (job.status === "cancelled" && job.current_step === stepId)
    return "cancelled";
  if (job.current_step === stepId) return "running";

  if (hasSuccess) return "done";
  if (job.status === "completed") return "done";
  return "pending";
}

function getStepDuration(logs: Job["logs"], stepId: string): string | null {
  const stepLogs = (logs ?? []).filter((log) => log.step === stepId);
  if (stepLogs.length < 2) return null;

  const firstLog = stepLogs[0];
  const lastLog = stepLogs[stepLogs.length - 1];

  try {
    const start = new Date(firstLog.ts).getTime();
    const end = new Date(lastLog.ts).getTime();
    const durationSeconds = Math.round((end - start) / 1000);
    return `${durationSeconds}s`;
  } catch {
    return null;
  }
}

export default function StepRow({
  index,
  stepId,
  label,
  job,
  summary,
  isLast = false,
}: Props) {
  const status = getStepStatus(stepId, job);
  const duration = getStepDuration(job.logs ?? [], stepId);

  const getIcon = () => {
    switch (status) {
      case "done":
        return "check_circle";
      case "running":
        return "refresh";
      case "failed":
        return "error";
      case "cancelled":
        return "stop_circle";
      default:
        return "schedule";
    }
  };

  const getIconColor = () => {
    switch (status) {
      case "done":
        return "text-emerald-500";
      case "running":
        return "text-primary";
      case "failed":
        return "text-rose-500";
      case "cancelled":
        return "text-amber-500";
      default:
        return "text-slate-400";
    }
  };

  const getBgColor = () => {
    switch (status) {
      case "done":
        return "bg-emerald-500";
      case "running":
        return "bg-primary";
      case "failed":
        return "bg-rose-500";
      case "cancelled":
        return "bg-amber-500";
      default:
        return "bg-slate-200 dark:bg-slate-800";
    }
  };

  const getConnectorColor = () => {
    if (status === "done") return "bg-emerald-500/30";
    if (status === "running") return "bg-primary/40";
    if (status === "failed") return "bg-rose-500/30";
    if (status === "cancelled") return "bg-amber-500/30";
    return "bg-slate-200 dark:bg-slate-800";
  };

  const isActive = status === "running";
  const isCompleted = status === "done";
  const isFailed = status === "failed";

  return (
    <div className="relative pl-10 pb-8 group">
      {/* Vertical connector line */}
      {!isLast && (
        <div
          className={`absolute left-4 top-4 bottom-0 w-0.5 ${getConnectorColor()}`}
        />
      )}

      {/* Step icon circle */}
      <div
        className={`absolute left-0 top-1 flex items-center justify-center w-8 h-8 rounded-full ${
          isActive
            ? "bg-primary text-white shadow-lg shadow-primary/40 outline outline-4 outline-background-dark dark:outline-background-dark z-10"
            : isCompleted
              ? `${getBgColor()} text-white z-10`
              : isFailed
                ? `${getBgColor()} text-white z-10`
                : `${getBgColor()} ${getIconColor()} z-10`
        }`}
      >
        <Icon
          name={getIcon()}
          className={
            isActive
              ? "animate-spin text-white"
              : isFailed
                ? "text-white"
                : ""
          }
          size={isActive ? 20 : 16}
        />
      </div>

      {/* Step content */}
      <div
        className={`transition-all duration-200 rounded-lg p-3 -mt-1 ${
          status === "running"
            ? "bg-primary/5 border border-primary/20 shadow-sm"
            : status === "failed"
              ? "bg-rose-500/5 border border-rose-500/30 shadow-sm"
              : status === "done"
                ? "bg-emerald-500/5 border border-emerald-500/20"
                : status === "cancelled"
                  ? "bg-amber-500/5 border border-amber-500/20"
                  : "opacity-60"
        }`}
      >
        <h4
          className={`text-sm font-bold dark:text-white mb-0.5 ${
            status === "running"
              ? "text-primary"
              : status === "failed"
                ? "text-rose-500"
                : status === "done"
                  ? "text-emerald-500"
                  : status === "cancelled"
                    ? "text-amber-500"
                    : ""
          }`}
        >
          {label}
        </h4>
        {summary != null && summary !== "" && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {summary}
          </p>
        )}
        {duration && status === "done" && (
          <span className="text-[10px] font-mono text-emerald-500 mt-1 inline-block uppercase tracking-tighter">
            Done in {duration}
          </span>
        )}
        {isActive && (
          <div className="mt-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all duration-1000 animate-pulse w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
