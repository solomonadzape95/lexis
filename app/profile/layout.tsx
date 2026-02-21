import type { ReactNode } from "react";

// Optional safety: skip static prerender for profile so it always runs with full layout.
export const dynamic = "force-dynamic";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
