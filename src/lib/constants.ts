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

/** Nomes de cookies usados pela aplicação */
export const COOKIE_NAMES = {
  SESSION_ID: "session_id",
  NEXT_LOCALE: "NEXT_LOCALE",
} as const;

/** Chaves de sessionStorage usadas pela aplicação */
export const SESSION_STORAGE_KEYS = {
  FLOW_NAV_DIRECTION: "bfe-flow-nav-direction",
} as const;
