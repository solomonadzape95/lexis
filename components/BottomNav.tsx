"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

const navItems = [
  { href: "/dashboard", label: "Projects", icon: "folder" },
  { href: "/analytics", label: "Analytics", icon: "analytics" },
  { href: "/profile", label: "Settings", icon: "settings" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 backdrop-blur-md z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/dashboard" && pathname === "/") ||
            (item.href === "/profile" && pathname.startsWith("/profile"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive ? "text-primary" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Icon name={item.icon} size={24} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
