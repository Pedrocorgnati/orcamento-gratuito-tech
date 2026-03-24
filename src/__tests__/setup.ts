import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// RESOLVED: mock next-intl globally so components using useTranslations/useLocale
// render correctly in unit/a11y tests without NextIntlClientProvider
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'pt-BR',
  useFormatter: () => ({
    dateTime: (date: Date) => date.toLocaleDateString(),
    number: (n: number) => n.toString(),
    list: (arr: string[]) => arr.join(', '),
  }),
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}))
