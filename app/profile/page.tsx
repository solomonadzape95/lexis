"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import Loader from "@/components/Loader";
import LanguageSelector from "@/components/LanguageSelector";
import { useTheme } from "@/components/ThemeProvider";
import { ALL_LANGUAGES } from "@/lib/languages";
import type { UserProfile } from "@/app/api/profile/route";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

export default function ProfilePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setDisplayName(data.display_name || data.github_username || "");
        setDefaultLanguage(data.default_language || "en");
        setPreferredLanguages(data.preferred_languages || []);
        // Sync theme from profile only once on load; after that user's choice wins until they save
        if (data.theme) setTheme(data.theme);
      })
      .catch(() => {
        // Handle error
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount to load profile
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          theme,
          default_language: defaultLanguage,
          preferred_languages: preferredLanguages,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save profile");
      }

      const updated = await res.json();
      setProfile(updated);
      router.refresh();
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto flex items-center justify-center">
            <div className="text-center">
              <Loader className="mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Loading profile...</p>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  const avatarUrl = profile?.github_avatar_url || null;
  const username = profile?.display_name || "User";

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
      <div className="flex flex-1 overflow-hidden min-w-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 pb-24 md:pb-6 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
              >
                <Icon name="arrow_back" size={24} />
              </button>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white truncate min-w-0">
                Profile Settings
              </h1>
            </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-8 space-y-6 sm:space-y-8">
          {/* Avatar and Display Name */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={username}
                  width={80}
                  height={80}
                  className="rounded-full w-20 h-20 object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900 dark:text-white"
                  placeholder="Your name"
                />
              </div>
            </div>
          </div>

          {/* Theme Selection */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Theme
            </label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {(["light", "dark", "system"] as const).map((themeOption) => (
                <button
                  key={themeOption}
                  type="button"
                  onClick={() => setTheme(themeOption)}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                    theme === themeOption
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="font-bold capitalize">{themeOption}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {themeOption === "system"
                      ? "Follow OS"
                      : themeOption === "light"
                        ? "Light mode"
                        : "Dark mode"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Default Language */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Default Language
            </label>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900 dark:text-white"
            >
              {ALL_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}{" "}
                  {lang.nativeName && `(${lang.nativeName})`}
                </option>
              ))}
            </select>
          </div>

          {/* Preferred Languages */}
          <div className="space-y-4">
            <LanguageSelector
              name="preferred_languages"
              defaultSelected={preferredLanguages}
              onChange={setPreferredLanguages}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader size="sm" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon name="check_circle" size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
