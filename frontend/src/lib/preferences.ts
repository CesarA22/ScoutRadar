import i18n from '../i18n'

export type AppTheme = 'dark' | 'light'
export type AppLanguage = 'pt' | 'en' | 'es'

const THEME_KEY = 'scoutradar-theme'
const LANG_KEY = 'scoutradar-language'

export function applyTheme(theme: AppTheme) {
  document.documentElement.classList.toggle('light', theme === 'light')
  localStorage.setItem(THEME_KEY, theme)
}

export function applyLanguage(lang: AppLanguage) {
  void i18n.changeLanguage(lang)
  localStorage.setItem(LANG_KEY, lang)
}

export function getStoredTheme(): AppTheme | null {
  const v = localStorage.getItem(THEME_KEY)
  return v === 'light' || v === 'dark' ? v : null
}

export function getStoredLanguage(): AppLanguage | null {
  const v = localStorage.getItem(LANG_KEY)
  return v === 'pt' || v === 'en' || v === 'es' ? v : null
}

export function applyUserPreferences(theme: AppTheme, language: AppLanguage) {
  applyTheme(theme)
  applyLanguage(language)
}
