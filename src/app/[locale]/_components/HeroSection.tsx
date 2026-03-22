import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/routing";

interface HeroSectionProps {
  locale: Locale;
}

export async function HeroSection({ locale }: HeroSectionProps) {
  const t = await getTranslations({ locale, namespace: "landing" });

  return (
    <section
      data-testid="hero-section"
      aria-labelledby="hero-headline"
      className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 px-4 py-16 sm:py-24 lg:py-32"
    >
      <div className="mx-auto max-w-3xl text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex">
          <span data-testid="hero-badge" className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
            {t("badge")}
          </span>
        </div>

        {/* Headline */}
        <h1
          id="hero-headline"
          data-testid="hero-headline"
          className="text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl dark:text-white"
        >
          {t("title")}{" "}
          <span className="text-blue-600 dark:text-blue-400">{t("titleHighlight")}</span>
        </h1>

        {/* Subheadline */}
        <p data-testid="hero-subtitle" className="mt-6 text-lg text-gray-600 sm:text-xl dark:text-gray-300">
          {t("subtitle")}
        </p>

        {/* CTA — RESOLVED: <Link><button> → <Link className> direto */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/flow"
            locale={locale}
            data-testid="hero-cta-button"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-shadow hover:bg-blue-700 hover:shadow-blue-500/40 w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
          >
            {t("calculate")}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t("estimatedMin")}
          </span>
        </div>

        {/* Trust indicators */}
        <div data-testid="hero-trust-indicators" className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{t("trustNoCadastro")}</span>
          <span>{t("trustLanguages")}</span>
          <span>{t("trustCurrencies")}</span>
          <span>{t("trustCriteria")}</span>
        </div>
      </div>
    </section>
  );
}
