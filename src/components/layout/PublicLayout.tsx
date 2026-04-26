import { Header } from "./Header";
import { MegaNavbar } from "./MegaNavbar";
import { Footer } from "./Footer";
import { cn } from "@/lib/utils";
import React from "react";
import type { AppLocale } from "@/i18n/routing";

interface PublicLayoutProps {
  children: React.ReactNode;
  locale: AppLocale;
  className?: string;
  variant?: "public" | "admin";
  isAuthenticated?: boolean;
  userEmail?: string;
  privacyLabel?: string;
  copyrightLabel?: string;
  skipLinkLabel?: string;
  logoutLabel?: string;
  homeAriaLabel?: string;
  footerNavLabel?: string;
}

export function PublicLayout({
  children,
  locale,
  className,
  variant = "public",
  isAuthenticated = false,
  userEmail,
  privacyLabel,
  copyrightLabel,
  skipLinkLabel = "Pular para conteúdo principal",
  logoutLabel,
  homeAriaLabel,
  footerNavLabel,
}: PublicLayoutProps) {
  return (
    <div data-testid="public-layout" className="flex min-h-screen flex-col">
      {/* Skip link — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-(--color-primary) focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-(--color-on-primary)"
      >
        {skipLinkLabel}
      </a>

      {variant === "admin" ? (
        <Header
          variant={variant}
          isAuthenticated={isAuthenticated}
          userEmail={userEmail}
          locale={locale}
          logoutLabel={logoutLabel}
          homeAriaLabel={homeAriaLabel}
        />
      ) : (
        <MegaNavbar locale={locale} />
      )}

      <main
        id="main-content"
        data-testid="main-content"
        tabIndex={-1}
        className={cn("flex-1 outline-none", className)}
      >
        {children}
      </main>

      <Footer
        locale={locale}
        privacyLabel={privacyLabel}
        copyrightLabel={copyrightLabel}
        footerNavLabel={footerNavLabel}
      />
    </div>
  );
}
