import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/agent/logger";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import Icon from "@/components/Icon";
import Link from "next/link";
import ProfileDropdown from "@/components/ProfileDropdown";
import type { Job } from "@/types";

async function getJobs(): Promise<Job[]> {
  const session = await getSession();
  if (!session || !supabaseAdmin) return [];

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("*")
    .or(
      `user_id.eq.${session.user.id},and(user_id.is.null,github_username.eq.${session.githubUsername ?? ""})`
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return [];
  return (data ?? []) as Job[];
}

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/?signin=required&next=/analytics");
  }

  const jobs = await getJobs();
  const completed = jobs.filter((j) => j.status === "completed").length;
  const failed = jobs.filter((j) => j.status === "failed").length;
  const cancelled = jobs.filter((j) => j.status === "cancelled").length;
  const uniqueRepos = new Set(jobs.map((j) => `${j.repo_owner}/${j.repo_name}`))
    .size;
  const successRate =
    jobs.length > 0 ? Math.round((completed / jobs.length) * 100) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
      <div className="flex flex-1 overflow-hidden min-w-0">
        <Sidebar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 pb-24 md:pb-6 min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                  Analytics
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Overview of your globalization activity
                </p>
              </div>
              <div className="flex items-center gap-4">
                <ProfileDropdown
                  avatarUrl={session.githubAvatarUrl}
                  username={session.githubUsername}
                  displayName={session.githubUsername}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Icon name="translate" size={24} className="text-primary" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {jobs.length}
                  </p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total jobs
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-emerald-500/10 p-3 rounded-lg">
                    <Icon name="check_circle" size={24} className="text-emerald-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {completed}
                  </p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Completed
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                    <Icon name="account_tree" size={24} className="text-slate-600 dark:text-slate-400" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {uniqueRepos}
                  </p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Repositories
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-emerald-500/10 p-3 rounded-lg">
                    <Icon name="check_circle" size={24} className="text-emerald-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {successRate != null ? `${successRate}%` : "—"}
                  </p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Success rate
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
                Status breakdown
              </h2>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Completed: {completed}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Failed: {failed}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Cancelled: {cancelled}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Other: {jobs.length - completed - failed - cancelled}
                  </span>
                </div>
              </div>
            </div>

            {jobs.length === 0 && (
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
                <Icon
                  name="analytics"
                  size={48}
                  className="text-slate-300 dark:text-slate-700 mx-auto mb-4"
                />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  No data yet
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Run some jobs to see analytics here
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all"
                >
                  <Icon name="add_circle" size={20} />
                  Create Job
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
