import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import type { AppLocale } from "@/i18n/routing";
import { ROUTES } from "@/lib/constants";

interface HeroSectionProps {
  locale: AppLocale;
}

export async function HeroSection({ locale }: HeroSectionProps) {
  const t = await getTranslations({ locale, namespace: "landing" });

  return (
    <section
      data-testid="hero-section"
      aria-labelledby="hero-headline"
      className="bg-gradient-to-b from-(--color-surface) to-(--color-background) px-4 py-16 sm:py-24 lg:py-32"
    >
      <div className="mx-auto max-w-3xl text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex">
          <span data-testid="hero-badge" className="inline-flex items-center rounded-full border border-(--color-accent) bg-(--color-accent)/20 px-4 py-1.5 text-sm font-medium text-(--color-primary)">
            {t("badge")}
          </span>
        </div>

        {/* Headline */}
        <h1
          id="hero-headline"
          data-testid="hero-headline"
          className="text-3xl font-bold text-(--color-text-primary) sm:text-4xl lg:text-5xl"
        >
          {t("title")}{" "}
          <span className="text-(--color-primary)">{t("titleHighlight")}</span>
        </h1>

        {/* Subheadline */}
        <p data-testid="hero-subtitle" className="mt-6 text-lg text-(--color-text-secondary) sm:text-xl">
          {t("subtitle")}
        </p>

        {/* CTA — RESOLVED: <Link><button> → <Link className> direto */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={ROUTES.flow}
            locale={locale}
            data-testid="hero-cta-button"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-(--color-primary) px-8 py-4 text-base font-semibold text-(--color-on-primary) shadow-lg shadow-(--color-primary)/25 transition-shadow hover:bg-(--color-primary-hover) hover:shadow-(--color-primary)/40 w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-primary)"
          >
            {t("calculate")}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <span className="text-sm text-(--color-text-muted)">
            {t("estimatedMin")}
          </span>
        </div>

        {/* Trust indicators */}
        <div data-testid="hero-trust-indicators" className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-(--color-text-muted)">
          <span>{t("trustNoCadastro")}</span>
          <span>{t("trustLanguages")}</span>
          <span>{t("trustCurrencies")}</span>
          <span>{t("trustCriteria")}</span>
        </div>
      </div>
    </section>
  );
}
