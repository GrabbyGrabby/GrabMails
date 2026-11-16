// GrabMails 34 Supported Locales (Adapted from Mailflare)
export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'pt-BR', label: 'Português (Brasil)', native: 'Português (Brasil)', flag: '🇧🇷', dir: 'ltr' },
  { code: 'pt-PT', label: 'Português (Portugal)', native: 'Português (Portugal)', flag: '🇵🇹', dir: 'ltr' },
  { code: 'es', label: 'Español', native: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', label: 'Français', native: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'de', label: 'Deutsch', native: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'ru', label: 'Русский', native: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  { code: 'zh', label: '中文（简体）', native: '中文（简体）', flag: '🇨🇳', dir: 'ltr' },
  { code: 'ja', label: '日本語', native: '日本語', flag: '🇯🇵', dir: 'ltr' },
  { code: 'id', label: 'Bahasa Indonesia', native: 'Bahasa Indonesia', flag: '🇮🇩', dir: 'ltr' },
  { code: 'tr', label: 'Türkçe', native: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  { code: 'vi', label: 'Tiếng Việt', native: 'Tiếng Việt', flag: '🇻🇳', dir: 'ltr' },
  { code: 'hi', label: 'हिन्दी', native: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ar', label: 'العربية', native: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'bn', label: 'বাংলা', native: 'বাংলা', flag: '🇧🇩', dir: 'ltr' },
  { code: 'ur', label: 'اردو', native: 'اردو', flag: '🇵🇰', dir: 'rtl' },
  { code: 'mr', label: 'मराठी', native: 'मराठी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'te', label: 'తెలుగు', native: 'తెలుగు', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ko', label: '한국어', native: '한국어', flag: '🇰🇷', dir: 'ltr' },
  { code: 'it', label: 'Italiano', native: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
  { code: 'ta', label: 'தமிழ்', native: 'தமிழ்', flag: '🇮🇳', dir: 'ltr' },
  { code: 'fa', label: 'فارسی', native: 'فارسی', flag: '🇮🇷', dir: 'rtl' },
  { code: 'ms', label: 'Bahasa Melayu', native: 'Bahasa Melayu', flag: '🇲🇾', dir: 'ltr' },
  { code: 'sw', label: 'Kiswahili', native: 'Kiswahili', flag: '🇰🇪', dir: 'ltr' },
  { code: 'th', label: 'ไทย', native: 'ไทย', flag: '🇹🇭', dir: 'ltr' },
  { code: 'gu', label: 'ગુજરાતી', native: 'ગુજરાતી', flag: '🇮🇳', dir: 'ltr' },
  { code: 'kn', label: 'ಕನ್ನಡ', native: 'ಕನ್ನಡ', flag: '🇮🇳', dir: 'ltr' },
  { code: 'pl', label: 'Polski', native: 'Polski', flag: '🇵🇱', dir: 'ltr' },
  { code: 'uk', label: 'Українська', native: 'Українська', flag: '🇺🇦', dir: 'ltr' },
  { code: 'nl', label: 'Nederlands', native: 'Nederlands', flag: '🇳🇱', dir: 'ltr' },
  { code: 'ml', label: 'മലയാളം', native: 'മലയാളം', flag: '🇮🇳', dir: 'ltr' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ha', label: 'Hausa', native: 'Hausa', flag: '🇳🇬', dir: 'ltr' },
  { code: 'si', label: 'සිංහල', native: 'සිංහල', flag: '🇱🇰', dir: 'ltr' },
]

export const RTL_LANGS = ['ar', 'ur', 'fa']

export function isRtl(lang) {
  return RTL_LANGS.includes(lang)
}

// Vite glob import of JSON catalogs
const localeModules = import.meta.glob('./locales/*.json')

export async function loadLocaleMessages(i18n, lang) {
  if (!lang) return

  // Synchronize RTL/LTR document direction
  if (typeof document !== 'undefined') {
    if (isRtl(lang)) {
      document.documentElement.setAttribute('dir', 'rtl')
      document.documentElement.classList.add('is-rtl')
    } else {
      document.documentElement.setAttribute('dir', 'ltr')
      document.documentElement.classList.remove('is-rtl')
    }
  }

  // If already loaded in i18n
  if (i18n.global.availableLocales.includes(lang)) {
    i18n.global.locale.value = lang
    return
  }

  // Dynamically import catalog
  const key = `./locales/${lang}.json`
  if (localeModules[key]) {
    try {
      const mod = await localeModules[key]()
      const messages = mod.default || mod
      i18n.global.setLocaleMessage(lang, messages)
      i18n.global.locale.value = lang
    } catch (e) {
      console.warn(`Failed to dynamically load locale ${lang}:`, e)
      i18n.global.locale.value = 'en'
    }
  } else {
    console.warn(`Locale catalog not found for ${lang}`)
    i18n.global.locale.value = 'en'
  }
}
