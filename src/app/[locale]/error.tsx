"use client";

import { PublicLayout } from "@/components/layout";
import { Button } from "@/components/ui";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const locale = useLocale() as Locale;

  useEffect(() => {
    console.error("Error:", error);
  }, [error]);

  return (
    <PublicLayout locale={locale}>
      <div
        role="main"
        aria-labelledby="error-title"
        className="relative flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
      >
        {/* Background number */}
        <span
          className="absolute select-none text-8xl font-black text-gray-100 sm:text-9xl dark:text-gray-800"
          aria-hidden="true"
        >
          500
        </span>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <span className="text-5xl" aria-hidden="true">
            ⚠️
          </span>

          <h1
            id="error-title"
            className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white"
          >
            Erro interno do servidor
          </h1>

          <p className="max-w-md text-base text-gray-600 dark:text-gray-400">
            Ocorreu um erro inesperado. Tente novamente.
          </p>

          {process.env.NODE_ENV === "development" && error.digest && (
            <p className="font-mono text-xs text-gray-400">
              Digest: {error.digest}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="primary" size="lg" onClick={reset}>
              Tentar novamente
            </Button>
            <Link href="/" locale={locale as any}>
              <Button variant="outline" size="lg">
                Voltar ao início
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
