# MCPilot Frontend

Frontend application for MCPilot, the browser-based MCP service management platform.

## Tech Stack

- React 18
- TypeScript 5.6
- Vite 5
- Tailwind CSS
- React Router v6
- TanStack Query
- Zustand
- Framer Motion
- Lucide Icons
- Sonner
- date-fns

## Quick Start

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

The Vite dev server is configured for `http://localhost:3001` and proxies `/api` requests to `http://localhost:8020`.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```text
src/
├── api/              # API client modules
├── components/       # Reusable React components
│   ├── common/       # Shared UI components
│   └── layout/       # Layout components
├── i18n/             # Locale messages and translation provider
│   ├── index.tsx     # Provider, hooks, locale registration
│   └── locales/      # Per-locale message files
├── pages/            # Route-level page components
├── router/           # Route definitions
├── store/            # Zustand stores
├── styles/           # Global styles
├── types/            # TypeScript types
├── utils/            # Formatting and utility helpers
├── App.tsx           # Root application component
└── main.tsx          # Application entrypoint
```

## Internationalization

The frontend defaults to English and currently supports English and Chinese.

Runtime behavior:

- The selected locale is persisted in `localStorage` with the key `mcpilot.locale`.
- Invalid or missing locale values fall back to English.
- `document.documentElement.lang` is updated when the locale changes.
- `document.title` is translated through the active locale.
- Dates and relative times should use `formatDate(date, locale)` and `formatRelativeTime(date, locale)`.

Key files:

- `src/i18n/index.tsx` defines `DEFAULT_LOCALE`, `messages`, `languages`, `I18nProvider`, `useI18n`, `translate`, and `getCurrentLocale`.
- `src/i18n/locales/en.ts` is the source schema for translation keys.
- `src/i18n/locales/zh.ts` provides Chinese translations and uses `satisfies MessageSchema` for key coverage.
- `src/components/common/LanguageSwitcher.tsx` renders the language selector.

### Using Translations

Use `useI18n()` in React components:

```tsx
import { useI18n } from '@/i18n'

export function Example() {
  const { t } = useI18n()

  return <h1>{t('dashboard.title')}</h1>
}
```

Use interpolation for dynamic values:

```tsx
t('service.confirmDelete', { name: service.name })
```

Use `translate()` outside React components:

```ts
import { getCurrentLocale, translate } from '@/i18n'

translate(getCurrentLocale(), 'auth.sessionExpired')
```

### Adding a Language

1. Create `src/i18n/locales/<locale>.ts`.
2. Import `MessageSchema` from `./en`.
3. Export the new locale object with `satisfies MessageSchema`.
4. Import the locale in `src/i18n/index.tsx`.
5. Add it to `messages`.
6. Add its metadata to `languages`.

Example:

```ts
import type { MessageSchema } from './en'

export const ja = {
  app: {
    title: 'MCPilot',
    name: 'MCPilot',
    tagline: '...',
    professionalTagline: '...',
  },
  // Keep all keys from en.ts.
} satisfies MessageSchema
```

### Translation Maintenance Rules

- Do not hard-code user-visible UI text in page or component files.
- Keep API values stable and translate only display labels. For example, template category API values remain `Database`, `File System`, and `General`.
- Add new translation keys to `en.ts` first, then update every locale file.
- Prefer existing common keys such as `common.loading`, `common.cancel`, `common.delete`, and `common.searchEmpty`.
- Pass the active `locale` into date formatting helpers instead of calling `toLocaleString()` directly.

## Features

- Authentication: login, registration, token refresh handling
- Dashboard: service health, status distribution, recent services, recent activity
- Service management: list, create, edit, detail, deploy, lifecycle actions
- Tool and resource management
- Version management and rollback
- Template library and service creation from templates
- Admin pages: users, alerts, Docker containers, audit logs
- English and Chinese UI switching

## Design Notes

- Global styles are defined in `src/styles/global.css`.
- Shared UI elements belong under `src/components/common`.
- Layout shell and navigation belong under `src/components/layout`.
- Status text should use `StatusBadge` or `status.*` translation keys.
- Icons should come from `lucide-react` when available.
