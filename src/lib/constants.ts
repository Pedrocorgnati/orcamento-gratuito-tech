export const LOCALES = ["pt-BR", "en-US", "es-ES", "it-IT"] as const;
export const DEFAULT_LOCALE = "pt-BR";

export const LOCALE_LABELS: Record<string, { label: string; flag: string }> = {
  "pt-BR": { label: "Português", flag: "🇧🇷" },
  "en-US": { label: "English", flag: "🇺🇸" },
  "es-ES": { label: "Español", flag: "🇪🇸" },
  "it-IT": { label: "Italiano", flag: "🇮🇹" },
};

export const ROUTES = {
  home: "/",
  flow: "/flow",
  admin: "/admin",
  privacy: "/privacy",
  authCallback: "/auth/callback",
  authLogout: "/api/auth/logout",
} as const;
