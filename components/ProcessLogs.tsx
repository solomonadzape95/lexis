"use client";

import { useRef, useEffect } from "react";
import type { LogEntry } from "@/types";
import Icon from "./Icon";

type Props = {
  logs: LogEntry[];
};

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}

function getLevelLabel(level: LogEntry["level"]): string {
  switch (level) {
    case "success":
      return "[SUCCESS]";
    case "warning":
      return "[WARN]";
    case "error":
      return "[ERROR]";
    case "info":
      return "[INFO]";
    default:
      return "[DEBUG]";
  }
}

function levelColor(level: LogEntry["level"]): string {
  switch (level) {
    case "success":
      return "text-emerald-500";
    case "warning":
      return "text-amber-500";
    case "error":
      return "text-rose-500";
    case "info":
      return "text-primary/70";
    default:
      return "text-slate-500";
  }
}

export default function ProcessLogs({ logs }: Props) {
  const entries = [...(logs ?? [])]; // Chronological order: oldest at top, newest at bottom
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleExport = () => {
    const logText = entries
      .map((entry) => {
        const time = formatTime(entry.ts);
        const level = getLevelLabel(entry.level);
        return `[${time}] ${level} ${entry.message}`;
      })
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase">
            Process Logs
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary flex items-center gap-1 transition-colors"
          >
            <Icon name="download" size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="flex flex-col bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 font-mono text-xs sm:text-sm leading-relaxed overflow-hidden shadow-sm dark:shadow-2xl max-h-[280px] sm:max-h-[380px] md:max-h-[500px]">
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto terminal-scroll"
        >
          <div className="space-y-1">
            {entries.length === 0 ? (
              <div className="flex gap-10">
                <span className="text-slate-500 dark:text-slate-600 w-14 text-right select-none shrink-0 whitespace-nowrap">
                  {formatTime(new Date().toISOString())}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  No logs yet.
                </span>
              </div>
            ) : (
              entries.map((entry, i) => (
                <div key={`${entry.ts}-${i}`} className="flex gap-10 group">
                  <span className="text-slate-500 dark:text-slate-600 w-16 text-right select-none shrink-0 whitespace-nowrap">
                    {formatTime(entry.ts)}
                  </span>
                  <span
                    className={`${levelColor(entry.level)} shrink-0 font-bold`}
                  >
                    {getLevelLabel(entry.level)}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 flex-1">
                    {entry.message}
                    {entry.data != null &&
                      Object.keys(entry.data).length > 0 && (
                        <span className="text-slate-500 dark:text-slate-400 ml-2">
                          {JSON.stringify(entry.data)}
                        </span>
                      )}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
