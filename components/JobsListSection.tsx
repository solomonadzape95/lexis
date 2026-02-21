"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Icon from "./Icon";
import Loader from "./Loader";
import JobTable from "./JobTable";
import type { Job } from "@/types";

const PAGE_SIZE = 20;

export default function JobsListSection() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchJobs = useCallback(
    async (offset: number, append: boolean) => {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      try {
        const res = await fetch(`/api/jobs?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = (await res.json()) as {
          jobs?: Job[];
          total?: number;
        };
        const list = data.jobs ?? [];
        const count = data.total ?? 0;

        setTotal(count);
        setJobs((prev) => (append ? [...prev, ...list] : list));
      } catch {
        if (!append) setJobs([]);
        setTotal(0);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, statusFilter]
  );

  // Initial load and when search/status change
  useEffect(() => {
    fetchJobs(0, false);
  }, [fetchJobs]);

  // Debounced search from input
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loadingMore || loading) return;
    if (jobs.length >= total) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollTop + clientHeight >= scrollHeight - 80) {
      fetchJobs(jobs.length, true);
    }
  }, [jobs.length, total, loading, loadingMore, fetchJobs]);

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
          Recent Jobs
        </h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-64 min-w-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon name="search" size={20} className="text-slate-400" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search repositories..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none min-w-0"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto min-w-0 px-4 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <div className="flex flex-col items-center gap-3">
            <Loader />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Loading jobs…
            </p>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
          <Icon
            name="inbox"
            size={48}
            className="text-slate-300 dark:text-slate-700 mx-auto mb-4"
          />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            No jobs found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {search || statusFilter !== "all"
              ? "Try changing search or filter."
              : "Get started by creating your first globalization job"}
          </p>
          {!search && statusFilter === "all" && (
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all"
            >
              <Icon name="add_circle" size={20} />
              Create Job
            </Link>
          )}
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="max-h-[320px] sm:max-h-[420px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 custom-scrollbar min-w-0"
        >
          <JobTable jobs={jobs} />
          {loadingMore && (
            <div className="flex items-center justify-center py-6 border-t border-slate-200 dark:border-slate-800">
              <Loader size="sm" />
            </div>
          )}
          {!loadingMore && jobs.length < total && (
            <div className="py-3 text-center text-xs text-slate-500 dark:text-slate-400">
              Scroll for more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
