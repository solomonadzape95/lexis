import Link from "next/link";
import { getSession } from "@/lib/supabase-server";
import SignInButton from "@/components/SignInButton";
import SignInPrompt from "@/components/SignInPrompt";
import Icon from "@/components/Icon";
import GlobalizeForm from "@/components/GlobalizeForm";
import ProfileDropdown from "@/components/ProfileDropdown";

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-grid-pattern">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6 max-w-7xl mx-auto w-full min-w-0">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer min-w-0 shrink-0">
          <div className="bg-primary p-1.5 sm:p-2 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
            <Icon name="language" size={22} className="sm:w-6 sm:h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
            Lexis
          </h2>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {session ? (
            <ProfileDropdown
              avatarUrl={session.githubAvatarUrl}
              username={session.githubUsername}
              displayName={session.githubUsername}
            />
          ) : (
            <SignInButton />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 py-8 sm:py-12 @container">
        {/* Hero Section */}
        <div className="max-w-4xl w-full text-center space-y-6 sm:space-y-8 mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black leading-tight tracking-[-0.04em] text-slate-900 dark:text-white">
            Globalize your Next.js <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              repo in one click.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Automated internationalization powered by AI agents. We scan your
            components, extract strings, and submit a PR with full translations.
          </p>
        </div>

        {/* Interaction Card */}
        {session ? (
          <GlobalizeForm showTitle={false} compact={false} />
        ) : (
          <SignInPrompt />
        )}

        {/* Visual Separator/Accent */}
        <div className="mt-16 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center space-y-2 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800">
            <Icon name="bolt" size={32} className="text-primary" />
            <h3 className="font-bold">Instant Scan</h3>
            <p className="text-sm text-slate-500">
              Detects every string, layout, and localized asset automatically.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-2 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800">
            <Icon name="auto_fix_high" size={32} className="text-primary" />
            <h3 className="font-bold">AI Native</h3>
            <p className="text-sm text-slate-500">
              Context-aware translations that respect your app's tone.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-2 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800">
            <Icon name="merge" size={32} className="text-primary" />
            <h3 className="font-bold">PR Ready</h3>
            <p className="text-sm text-slate-500">
              One-click pull requests with clean, production-ready code.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 sm:py-10 px-4 sm:px-6 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-center md:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Powered by
            </span>
            <div className="flex items-center gap-6 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <span className="bg-green-500 h-4 w-4 rounded-full" />
                Lingo.dev
              </div>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <Icon name="diamond" size={20} className="text-blue-400" />
                Gemini
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
