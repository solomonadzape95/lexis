"use client";

import { createBrowserClient } from "@/lib/supabase";
import Icon from "./Icon";

export default function SignInButton() {
  async function handleSignIn() {
    try {
      const supabase = createBrowserClient();
      // Use NEXT_PUBLIC_APP_URL in production so redirect never goes to localhost
      const origin =
        typeof window !== "undefined"
          ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
          : process.env.NEXT_PUBLIC_APP_URL || "";
      const redirectTo = `${origin}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo,
          scopes: "repo user:email",
        },
      });

      if (error) {
        console.error("OAuth error:", error);
        alert(`Sign-in failed: ${error.message}`);
      }
    } catch (err) {
      console.error("Sign-in error:", err);
      alert(
        `Sign-in failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
    >
      <Icon name="person" size={18} />
      Sign In
    </button>
  );
}
