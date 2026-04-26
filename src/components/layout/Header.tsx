import { LanguageSelector } from "./LanguageSelector";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { AppLocale } from "@/i18n/routing";
import { ROUTES } from "@/lib/constants";

interface HeaderProps {
  variant?: "public" | "admin";
  isAuthenticated?: boolean;
  userEmail?: string;
  locale: AppLocale;
  logoutLabel?: string;
  homeAriaLabel?: string;
}

export function Header({
  variant = "public",
  isAuthenticated = false,
  userEmail,
  locale,
  logoutLabel = "Sair",
  homeAriaLabel = "Budget Free Engine — Início",
}: HeaderProps) {
  return (
    <header data-testid="header" className="sticky top-0 z-40 h-14 w-full border-b border-(--color-border)/50 bg-(--color-background)/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href={ROUTES.home}
          locale={locale}
          data-testid="header-logo-link"
          className="flex items-center gap-2 text-lg font-bold text-(--color-text-primary) hover:text-(--color-primary) transition-colors"
          aria-label={homeAriaLabel}
        >
          <Image
            src="/images/logo.svg"
            alt="Budget Free Engine"
            width={140}
            height={32}
            priority
          />
        </Link>

        {/* Right side */}
        <div data-testid="header-actions" className="flex items-center gap-3">
          <LanguageSelector />

          {variant === "admin" && isAuthenticated && (
            <>
              {userEmail && (
                <span data-testid="header-user-email" className="hidden sm:inline text-sm text-(--color-text-secondary)">
                  {userEmail}
                </span>
              )}
              <form data-testid="header-logout-form" action={ROUTES.authLogout} method="POST">
                <button
                  data-testid="header-logout-button"
                  type="submit"
                  className="flex min-h-[44px] items-center rounded-md px-3 text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-muted) transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)"
                >
                  {logoutLabel}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
