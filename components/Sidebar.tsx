"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

const navItems = [
  { href: "/dashboard", label: "Projects", icon: "folder" },
  { href: "/analytics", label: "Analytics", icon: "analytics" },
  { href: "/profile", label: "Settings", icon: "settings" },
];

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 h-screen sticky top-0 transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo + Minimize */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
        <Link href="/" className={`flex items-center gap-2 min-w-0 ${collapsed ? "justify-center w-full" : ""}`}>
          <div className="bg-primary p-2 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
            <Icon name="language" size={24} />
          </div>
          {!collapsed && (
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
              Lexis
            </h2>
          )}
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Minimize sidebar"
            aria-label="Minimize sidebar"
          >
            <Icon name="arrow_back" size={20}/>
          </button>
        )}
      </div>
      {collapsed && (
        <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex justify-center">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <Icon name="arrow_forward_ios" size={18} />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-hidden">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/dashboard" && pathname === "/") ||
            (item.href === "/profile" && pathname.startsWith("/profile"));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                collapsed ? "justify-center px-0" : ""
              } ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon name={item.icon} size={20} className="shrink-0" />
              {!collapsed && <span className="font-medium truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* New Job Button */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <Link
          href="/"
          title={collapsed ? "New Job" : undefined}
          className={`bg-primary hover:bg-primary/90 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all ${
            collapsed ? "w-10 h-10 p-0" : "w-full px-4 py-3"
          }`}
        >
          <Icon name="add_circle" size={20} />
          {!collapsed && <span>New Job</span>}
        </Link>
      </div>
    </aside>
  );
}
