import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt-BR", "en-US", "es-ES", "it-IT"] as const,
  defaultLocale: "pt-BR",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

/** @deprecated Use AppLocale instead */
export type Locale = AppLocale;

/**
 * Mapeamento de locale URL (BCP-47) para enum interno (underscore).
 * Usado ao integrar com enums de @/lib/enums (Locale.PT_BR etc.).
 */
export const LOCALE_URL_TO_ENUM: Record<AppLocale, string> = {
  "pt-BR": "pt_BR",
  "en-US": "en_US",
  "es-ES": "es_ES",
  "it-IT": "it_IT",
};

export const LOCALE_ENUM_TO_URL: Record<string, AppLocale> = {
  pt_BR: "pt-BR",
  en_US: "en-US",
  es_ES: "es-ES",
  it_IT: "it-IT",
};
