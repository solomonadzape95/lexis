"use client";

import type { Job } from "@/types";
import Icon from "./Icon";

type Props = {
  jobs: Job[];
};

export default function DashboardStats({ jobs }: Props) {
  const completedJobs = jobs.filter((job) => job.status === "completed").length;

  const activeJobs = jobs.filter((job) => job.status === "running").length;

  const failedJobs = jobs.filter((job) => job.status === "failed").length;

  const stats = [
    {
      label: "Total Translations",
      value: completedJobs.toLocaleString(),
      icon: "translate",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Active Jobs",
      value: activeJobs.toString(),
      icon: "sync",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      pulse: activeJobs > 0,
    },
    {
      label: "Failed Checks",
      value: failedJobs.toString(),
      icon: "error",
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm min-w-0"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`${stat.bgColor} p-3 rounded-lg`}>
              <Icon name={stat.icon} size={24} className={stat.color} />
            </div>
            {stat.trend && (
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                {stat.trend}
              </span>
            )}
            {stat.pulse && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {stat.value}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
