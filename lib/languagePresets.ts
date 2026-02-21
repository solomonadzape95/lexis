export type LanguagePreset = {
  id: string
  name: string
  languages: string[]
  description: string
}

export const LANGUAGE_PRESETS: LanguagePreset[] = [
  {
    id: 'european',
    name: 'European Markets',
    languages: ['es', 'fr', 'de', 'it'],
    description: 'Spanish, French, German, Italian',
  },
  {
    id: 'asian',
    name: 'Asian Markets',
    languages: ['ja', 'zh', 'ko'],
    description: 'Japanese, Chinese, Korean',
  },
  {
    id: 'americas',
    name: 'Americas',
    languages: ['es', 'pt'],
    description: 'Spanish, Portuguese',
  },
]

export const ALL_LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' },
]
