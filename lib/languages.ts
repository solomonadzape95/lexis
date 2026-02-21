export type Language = {
  code: string
  name: string
  nativeName?: string
  flag: string // emoji flag
  region?: string
}

export const ALL_LANGUAGES: Language[] = [
  // European Languages
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', region: 'Europe' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', region: 'Europe' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', region: 'Europe' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', region: 'Europe' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', region: 'Europe' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', region: 'Europe' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', region: 'Europe' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', region: 'Europe' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', region: 'Europe' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', region: 'Europe' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', region: 'Europe' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', region: 'Europe' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', region: 'Europe' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', region: 'Europe' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', region: 'Europe' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿', region: 'Europe' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', region: 'Europe' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺', region: 'Europe' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬', region: 'Europe' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷', region: 'Europe' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰', region: 'Europe' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮', region: 'Europe' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪', region: 'Europe' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻', region: 'Europe' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹', region: 'Europe' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪', region: 'Europe' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', flag: '🇲🇹', region: 'Europe' },
  
  // Asian Languages
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', region: 'Asia' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', region: 'Asia' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', region: 'Asia' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', region: 'Asia' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', region: 'Asia' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', region: 'Asia' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', region: 'Asia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾', region: 'Asia' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭', region: 'Asia' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', region: 'Asia' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', region: 'Asia' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', region: 'Asia' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', region: 'Asia' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', region: 'Asia' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', region: 'Middle East' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', region: 'Middle East' },
  
  // Americas
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', flag: '🇧🇷', region: 'Americas' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)', flag: '🇲🇽', region: 'Americas' },
  { code: 'es-AR', name: 'Spanish (Argentina)', nativeName: 'Español (Argentina)', flag: '🇦🇷', region: 'Americas' },
  
  // African Languages
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', region: 'Africa' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦', region: 'Africa' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦', region: 'Africa' },
  
  // Other
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', region: 'Europe' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', flag: '🇧🇾', region: 'Europe' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', flag: '🇷🇸', region: 'Europe' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', flag: '🇲🇰', region: 'Europe' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', flag: '🇮🇸', region: 'Europe' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', flag: '🇬🇧', region: 'Europe' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', flag: '🇪🇸', region: 'Europe' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', flag: '🇪🇸', region: 'Europe' },
]

// Helper function to get language by code
export function getLanguageByCode(code: string): Language | undefined {
  return ALL_LANGUAGES.find((lang) => lang.code === code)
}

// Helper function to get languages by region
export function getLanguagesByRegion(region: string): Language[] {
  return ALL_LANGUAGES.filter((lang) => lang.region === region)
}

// Popular languages (most commonly used)
export const POPULAR_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'ja', 'zh', 'pt', 'it', 'ru', 'ko',
  'ar', 'hi', 'nl', 'tr', 'pl', 'sv', 'da', 'fi', 'no', 'th',
]

// Language presets for quick selection
export const LANGUAGE_PRESETS = [
  {
    id: 'european',
    name: 'European Markets',
    languages: ['es', 'fr', 'de', 'it', 'pt', 'nl'],
    description: 'Spanish, French, German, Italian, Portuguese, Dutch',
  },
  {
    id: 'asian',
    name: 'Asian Markets',
    languages: ['ja', 'zh', 'ko', 'hi', 'th', 'vi'],
    description: 'Japanese, Chinese, Korean, Hindi, Thai, Vietnamese',
  },
  {
    id: 'americas',
    name: 'Americas',
    languages: ['es-MX', 'pt-BR', 'es-AR'],
    description: 'Spanish (Mexico), Portuguese (Brazil), Spanish (Argentina)',
  },
  {
    id: 'middle-east',
    name: 'Middle East',
    languages: ['ar', 'he', 'fa', 'tr'],
    description: 'Arabic, Hebrew, Persian, Turkish',
  },
]
