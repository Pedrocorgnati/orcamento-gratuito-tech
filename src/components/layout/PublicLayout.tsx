import { Header } from "./Header";
import { Footer } from "./Footer";
import { cn } from "@/lib/utils";
import React from "react";
import type { Locale } from "@/i18n/routing";

interface PublicLayoutProps {
  children: React.ReactNode;
  locale: Locale;
  className?: string;
  variant?: "public" | "admin";
  isAuthenticated?: boolean;
  userEmail?: string;
  privacyLabel?: string;
  copyrightLabel?: string;
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
}: PublicLayoutProps) {
  return (
    <div data-testid="public-layout" className="flex min-h-screen flex-col">
      {/* Skip link — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Pular para conteúdo principal
      </a>

      <Header
        variant={variant}
        isAuthenticated={isAuthenticated}
        userEmail={userEmail}
        locale={locale}
      />

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
      />
    </div>
  );
}
