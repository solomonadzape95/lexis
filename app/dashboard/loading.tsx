import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import Loader from "@/components/Loader";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader className="text-primary" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Loading projects…
            </p>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
