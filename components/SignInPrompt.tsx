"use client";

import { createBrowserClient } from "@/lib/supabase";
import Icon from "./Icon";

export default function SignInPrompt() {
  async function handleSignIn() {
    try {
      const supabase = createBrowserClient();
      // Use NEXT_PUBLIC_APP_URL in production so redirect never goes to localhost
      const origin =
        typeof window !== "undefined"
          ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
          : process.env.NEXT_PUBLIC_APP_URL || "";
      const redirectTo = `${origin}/auth/callback`;

      console.log("Initiating GitHub OAuth, redirectTo:", redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo,
          scopes: "repo user:email", // 'repo' scope required for write access (fork, push, PR)
        },
      });

      if (error) {
        console.error("OAuth error:", error);
        alert(`Sign-in failed: ${error.message}`);
      } else if (data?.url) {
        console.log("Redirecting to:", data.url);
        // The redirect happens automatically, but log it for debugging
      }
    } catch (err) {
      console.error("Sign-in error:", err);
      alert(
        `Sign-in failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  return (
    <section className="w-full max-w-2xl bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-10 shadow-2xl space-y-8">
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Sign In Required
        </label>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Sign in with your GitHub account to run the pipeline. The agent will
          use your account to fork the repo, push changes, and open a pull
          request.
        </p>
      </div>
      <button
        type="button"
        onClick={handleSignIn}
        className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
      >
        <Icon name="person" size={18} />
        Sign In
      </button>
    </section>
  );
}
