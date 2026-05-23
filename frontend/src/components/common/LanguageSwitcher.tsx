import { Globe2 } from 'lucide-react'
import { languages, useI18n, type Locale } from '@/i18n'

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n()

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <Globe2 className="h-4 w-4 text-slate-400" />
      {!compact && <span className="sr-only">{t('common.language')}</span>}
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        aria-label={t('common.language')}
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  )
}
