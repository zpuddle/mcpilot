import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { en, type MessageSchema } from './locales/en'
import { zh } from './locales/zh'

const STORAGE_KEY = 'mcpilot.locale'

export const DEFAULT_LOCALE = 'en'

export const messages = {
  en,
  zh,
} as const

export const languages = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文' },
] as const

export type Locale = keyof typeof messages
type MessageTree = MessageSchema
type MessageValue = string | { readonly [key: string]: MessageValue }
type TranslationParams = Record<string, string | number>

type DotKeys<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotKeys<T[K]>}`
}[keyof T & string]

export type TranslationKey = DotKeys<MessageTree>

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, params?: TranslationParams) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && value in messages)
}

export function getCurrentLocale(): Locale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  return isLocale(stored) ? stored : DEFAULT_LOCALE
}

function getNestedMessage(tree: MessageTree, key: TranslationKey): string {
  const value = key.split('.').reduce<MessageValue | undefined>((current, segment) => {
    if (!current || typeof current === 'string') {
      return undefined
    }
    return current[segment]
  }, tree)

  return typeof value === 'string' ? value : key
}

function interpolate(template: string, params?: TranslationParams) {
  if (!params) {
    return template
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    params[name] === undefined ? `{{${name}}}` : String(params[name])
  )
}

export function translate(locale: Locale, key: TranslationKey, params?: TranslationParams) {
  return interpolate(getNestedMessage(messages[locale], key), params)
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getCurrentLocale)

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale)
    window.localStorage.setItem(STORAGE_KEY, nextLocale)
  }

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
    document.title = translate(locale, 'app.title')
  }, [locale])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
    }),
    [locale]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
