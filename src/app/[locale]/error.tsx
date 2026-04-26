"use client";

import { PublicLayout } from "@/components/layout";
import { Button } from "@/components/ui";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { useEffect } from "react";
import { reportError } from "@/lib/errors";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("errors");
  const tCommon = useTranslations("common");

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary]", error.message, error.digest);
    }
    reportError(error, { digest: error.digest, locale, source: "locale-error" });
  }, [error, locale]);

  return (
    <PublicLayout
      locale={locale}
      skipLinkLabel={tCommon("skipToContent")}
      logoutLabel={tCommon("admin.logout")}
      privacyLabel={tCommon("privacyPolicy")}
      copyrightLabel={tCommon("copyright")}
      homeAriaLabel={tCommon("homeAriaLabel")}
      footerNavLabel={tCommon("footerNav")}
    >
      <div
        data-testid="page-error"
        role="main"
        aria-labelledby="error-title"
        className="relative flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
      >
        {/* Background number */}
        <span
          className="absolute select-none text-8xl font-black text-(--color-border) sm:text-9xl"
          aria-hidden="true"
        >
          500
        </span>

        {/* Content */}
        <div data-testid="error-content" className="relative z-10 flex flex-col items-center gap-4">
          <span className="text-5xl" aria-hidden="true">
            ⚠️
          </span>

          <h1
            id="error-title"
            data-testid="error-title"
            className="text-2xl font-bold text-(--color-text-primary) sm:text-3xl"
          >
            {t("serverError")}
          </h1>

          <p data-testid="error-message" className="max-w-md text-base text-(--color-text-secondary)">
            {t("serverErrorMessage")}
          </p>

          {/* Digest para debugging (apenas dev) */}
          {process.env.NODE_ENV === "development" && error.digest && (
            <p data-testid="error-digest" className="font-mono text-xs text-(--color-text-muted)">
              Digest: {error.digest}
            </p>
          )}

          <div data-testid="error-actions" className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="primary"
              size="lg"
              onClick={reset}
              data-testid="error-retry-button"
              aria-label={t("tryAgain")}
            >
              {t("tryAgain")}
            </Button>
            <Link href="/" data-testid="error-home-link">
              <Button variant="outline" size="lg">
                {t("goHome")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
