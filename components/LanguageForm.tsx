"use client";

import { useState } from "react";
import Icon from "./Icon";
import { ALL_LANGUAGES } from "@/lib/languagePresets";

export default function LanguageForm() {
  const [showMore, setShowMore] = useState(false);
  const defaultLanguages = ["es", "fr", "de", "ja", "zh"];
  const displayedLanguages = showMore
    ? ALL_LANGUAGES
    : ALL_LANGUAGES.slice(0, 5);

  return (
    <div className="space-y-4">
      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        Select Target Languages
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {displayedLanguages.map((lang) => (
          <label
            key={lang.code}
            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:border-primary/50 transition-colors group"
          >
            <input
              type="checkbox"
              name="languages"
              value={lang.code}
              className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary bg-transparent"
              defaultChecked={defaultLanguages.includes(lang.code)}
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary">
              {lang.name}
            </span>
          </label>
        ))}
        {!showMore && (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 hover:text-primary hover:border-primary transition-all group"
          >
            <Icon name="add" size={18} />
            <span className="text-sm font-medium">Add More</span>
          </button>
        )}
      </div>
    </div>
  );
}
