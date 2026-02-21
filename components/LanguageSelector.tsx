'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { ALL_LANGUAGES, type Language } from '@/lib/languages'
import Icon from './Icon'

type Props = {
  name?: string
  defaultSelected?: string[]
  onChange?: (selected: string[]) => void
  className?: string
}

export default function LanguageSelector({
  name = 'languages',
  defaultSelected = [],
  onChange,
  className = '',
}: Props) {
  const [selected, setSelected] = useState<string[]>(defaultSelected)
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return ALL_LANGUAGES

    const query = searchQuery.toLowerCase()
    return ALL_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(query) ||
        lang.nativeName?.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query),
    )
  }, [searchQuery])

  const toggleLanguage = (code: string) => {
    const newSelected = selected.includes(code)
      ? selected.filter((c) => c !== code)
      : [...selected, code]
    setSelected(newSelected)
    onChange?.(newSelected)
  }

  const removeLanguage = (code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSelected = selected.filter((c) => c !== code)
    setSelected(newSelected)
    onChange?.(newSelected)
  }

  const selectedLanguages = useMemo(() => {
    return selected.map((code) => ALL_LANGUAGES.find((l) => l.code === code)).filter(Boolean) as Language[]
  }, [selected])

  return (
    <div className={`space-y-3 ${className}`} ref={containerRef}>
      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        Select Target Languages
      </label>

      {/* Selected languages chips */}
      {selectedLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLanguages.map((lang) => (
            <div
              key={lang.code}
              className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.name}</span>
              <button
                type="button"
                onClick={(e) => removeLanguage(lang.code, e)}
                className="ml-1 hover:bg-primary/20 rounded p-0.5 transition-colors"
              >
                <Icon name="error" size={14} />
              </button>
              <input type="hidden" name={name} value={lang.code} />
            </div>
          ))}
        </div>
      )}

      {/* Search input and dropdown */}
      <div className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="search" size={18} className="text-slate-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search languages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
          {selected.length > 0 && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                {selected.length}
              </span>
            </div>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-96 overflow-y-auto custom-scrollbar">
            {filteredLanguages.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                No languages found
              </div>
            ) : (
              <div className="p-2">
                {filteredLanguages.map((lang) => {
                  const isSelected = selected.includes(lang.code)
                  return (
                    <label
                      key={lang.code}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleLanguage(lang.code)}
                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary bg-transparent"
                      />
                      <span className="text-xl">{lang.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {lang.name}
                        </div>
                        {lang.nativeName && lang.nativeName !== lang.name && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {lang.nativeName}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-600 font-mono">
                        {lang.code}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Language presets */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const codes = ['es', 'fr', 'de', 'it']
            setSelected(codes)
            onChange?.(codes)
          }}
          className="text-xs px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          European
        </button>
        <button
          type="button"
          onClick={() => {
            const codes = ['ja', 'zh', 'ko']
            setSelected(codes)
            onChange?.(codes)
          }}
          className="text-xs px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Asian
        </button>
        <button
          type="button"
          onClick={() => {
            const codes = ['es-MX', 'pt-BR']
            setSelected(codes)
            onChange?.(codes)
          }}
          className="text-xs px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Americas
        </button>
      </div>
    </div>
  )
}
