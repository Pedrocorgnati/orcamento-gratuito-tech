import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt-BR", "en-US", "es-ES", "it-IT"] as const,
  defaultLocale: "pt-BR",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/privacy": "/privacy",
    "/flow": "/flow",
    "/flow/[questionId]": "/flow/[questionId]",
    "/lead-capture": "/lead-capture",
    "/result": "/result",
    "/resume": "/resume",
    "/thank-you": "/thank-you",
    "/admin": "/admin",
    "/admin/leads": "/admin/leads",
    "/admin/leads/[id]": "/admin/leads/[id]",
    "/auth/callback": "/auth/callback",
    "/solucoes": {
      "pt-BR": "/solucoes",
      "en-US": "/solutions",
      "es-ES": "/soluciones",
      "it-IT": "/soluzioni",
    },
    "/solucoes/[slug]": {
      "pt-BR": "/solucoes/[slug]",
      "en-US": "/solutions/[slug]",
      "es-ES": "/soluciones/[slug]",
      "it-IT": "/soluzioni/[slug]",
    },
  },
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

/**
 * Segmento traduzido do hub de soluções por locale.
 * Útil para construir URLs absolutas (sitemap, hreflang, OG).
 */
export const SOLUTIONS_HUB_SEGMENT: Record<AppLocale, string> = {
  "pt-BR": "solucoes",
  "en-US": "solutions",
  "es-ES": "soluciones",
  "it-IT": "soluzioni",
};

/**
 * Retorna o path absoluto-localizado para hub ou slug de solução.
 * Usar em sitemap.ts, hreflang e OG.
 */
export function getLocalizedSolutionPath(
  target: "__hub__" | string,
  locale: AppLocale,
): string {
  const seg = SOLUTIONS_HUB_SEGMENT[locale];
  return target === "__hub__" ? `/${seg}` : `/${seg}/${target}`;
}
