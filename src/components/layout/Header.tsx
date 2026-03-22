import { LanguageSelector } from "./LanguageSelector";
import { Link } from "@/i18n/navigation";
import { Zap } from "lucide-react";
import type { Locale } from "@/i18n/routing";

interface HeaderProps {
  variant?: "public" | "admin";
  isAuthenticated?: boolean;
  userEmail?: string;
  locale: Locale;
}

export function Header({
  variant = "public",
  isAuthenticated = false,
  userEmail,
  locale,
}: HeaderProps) {
  return (
    <header data-testid="header" className="sticky top-0 z-40 h-14 w-full border-b border-gray-200/50 bg-white/95 backdrop-blur-sm dark:border-gray-800/50 dark:bg-gray-950/95">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          locale={locale}
          data-testid="header-logo-link"
          className="flex items-center gap-2 text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors dark:text-white dark:hover:text-blue-400"
          aria-label="Budget Free Engine — Início"
        >
          {/* @ASSET_PLACEHOLDER name: logo-symbol type: image extension: svg format: 1:1 dimensions: 24x24 description: Logo símbolo do Budget Free Engine. style: Minimalista, stroke outline, monocromático. colors: primary (#4F46E5) light, primary-dark (#818CF8) dark context: Header navbar */}
          <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <span className="hidden sm:inline">Budget Free Engine</span>
          <span className="sm:hidden">BFE</span>
        </Link>

        {/* Right side */}
        <div data-testid="header-actions" className="flex items-center gap-3">
          <LanguageSelector />

          {/* RESOLVED: <Link><Button> → <Link className> direto — HTML válido + touch target 44px */}
          {variant === "public" && !isAuthenticated && (
            <Link
              href="/admin"
              locale={locale}
              data-testid="header-login-link"
              className="flex min-h-[44px] items-center rounded-md px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Login
            </Link>
          )}

          {variant === "admin" && isAuthenticated && (
            <>
              {userEmail && (
                <span data-testid="header-user-email" className="hidden sm:inline text-sm text-gray-600 dark:text-gray-400">
                  {userEmail}
                </span>
              )}
              <form data-testid="header-logout-form" action="/api/auth/logout" method="POST">
                <button
                  data-testid="header-logout-button"
                  type="submit"
                  className="flex min-h-[44px] items-center rounded-md px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Sair
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
