import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/agent/logger";
import { getSession } from "@/lib/supabase-server";
import type { Job } from "@/types";
import JobProgress from "@/components/JobProgress";
import Icon from "@/components/Icon";
import ProfileDropdown from "@/components/ProfileDropdown";

export const dynamic = "force-dynamic";

type PageParams = {
  params: {
    jobId: string;
  };
};

function getStatusDisplay(job: Job) {
  switch (job.status) {
    case "running":
      return { label: "Running", color: "text-primary", pulse: true };
    case "completed":
      return { label: "Completed", color: "text-emerald-500", pulse: false };
    case "failed":
      return { label: "Failed", color: "text-rose-500", pulse: false };
    case "cancelled":
      return { label: "Cancelled", color: "text-amber-500", pulse: false };
    default:
      return { label: "Pending", color: "text-slate-400", pulse: false };
  }
}

export default async function JobPage({ params }: PageParams) {
  const session = await getSession();
  if (!session) {
    redirect(`/?signin=required&next=/jobs/${params.jobId}`);
  }

  if (!supabaseAdmin) notFound();
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("*")
    .eq("id", params.jobId)
    .single();

  if (error || !data) notFound();
  const job = data as Job;
  if (job.user_id != null && job.user_id !== session.user.id) notFound();

  const statusDisplay = getStatusDisplay(job);

  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-primary/20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4 justify-between max-w-[1440px] mx-auto w-full min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            >
              <Icon name="arrow_back" size={24} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Icon name="language" size={20} />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold leading-tight tracking-tight dark:text-white truncate">
                  Lexis
                </h1>
               
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
              {statusDisplay.pulse && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
              )}
              <span
                className={`${statusDisplay.color} text-xs font-bold uppercase tracking-wider`}
              >
                {statusDisplay.label}
              </span>
            </div>
            <ProfileDropdown
              avatarUrl={session.githubAvatarUrl}
              username={session.githubUsername}
              displayName={session.githubUsername}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="max-w-[1440px] mx-auto w-full p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 h-full min-w-0 overflow-auto">
          <JobProgress initialJob={job} />
        </div>
      </main>
    </div>
  );
}
