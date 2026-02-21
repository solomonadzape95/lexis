import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/agent/logger";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import DashboardStats from "@/components/DashboardStats";
import JobsListSection from "@/components/JobsListSection";
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
    .limit(50);

  if (error) return [];
  return (data ?? []) as Job[];
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/?signin=required&next=/dashboard");
  }

  const jobs = await getJobs();

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
      <div className="flex flex-1 overflow-hidden min-w-0">
        {/* Sidebar (Desktop) */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 pb-24 md:pb-6 min-w-0">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                  Dashboard
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Manage your globalization jobs
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

            {/* Stats */}
            <DashboardStats jobs={jobs} />

            {/* Jobs List: search, filter, infinite scroll */}
            <JobsListSection />
          </div>
        </main>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <BottomNav />
    </div>
  );
}
