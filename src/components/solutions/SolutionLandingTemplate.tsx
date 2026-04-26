import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { SOLUTIONS, type SolutionSlug } from "@/lib/solutions/catalog";
import { getTranslations } from "next-intl/server";
import { SolutionIcon } from "@/components/layout/SolutionIcon";
import { SolutionFAQClient } from "./SolutionFAQClient";
import { getSolutionCopy } from "@/lib/solutions/copy";

type Props = { slug: SolutionSlug; locale: AppLocale };

export async function SolutionLandingTemplate({ slug, locale }: Props) {
  const entry = SOLUTIONS[slug];
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tCommon = await getTranslations({ locale, namespace: "solutions.common" });
  const copy = getSolutionCopy(locale, slug);

  const name = tNav(`items.${slug}.name`);

  const flowHref = {
    pathname: "/flow" as const,
    query: { preselect: String(entry.preselectFlowOption) },
  };

  return (
    <>
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        data-testid="breadcrumb-nav"
        className="mx-auto max-w-6xl px-4 pt-6 md:px-6"
      >
        <ol className="flex flex-wrap items-center gap-2 text-sm text-(--color-text-secondary)">
          <li>
            <Link
              href="/"
              locale={locale}
              className="hover:text-(--color-primary) transition-colors"
            >
              {tCommon("breadcrumbHome")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href="/solucoes"
              locale={locale}
              className="hover:text-(--color-primary) transition-colors"
            >
              {tCommon("breadcrumbHub")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-(--color-text-primary) font-medium">
            {name}
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-24 text-center">
        <div className="flex justify-center mb-6">
          <SolutionIcon
            iconKey={entry.iconKey}
            className="h-12 w-12 text-(--color-primary)"
          />
        </div>
        <h1
          data-testid="solution-hero-h1"
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-(--color-text-primary)"
        >
          {copy.hero.h1}
        </h1>
        <p className="mt-5 text-lg md:text-xl text-(--color-text-secondary) max-w-2xl mx-auto">
          {copy.hero.subtitle}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={flowHref}
            locale={locale}
            data-testid="solution-cta-primary"
            className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-(--color-primary) px-6 text-base font-semibold text-(--color-on-primary) shadow-sm hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2"
          >
            {copy.hero.cta}
          </Link>
          <Link
            href="/solucoes"
            locale={locale}
            className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-(--color-border) px-6 text-base font-medium text-(--color-text-primary) hover:bg-(--color-muted) transition-colors"
          >
            {tCommon("ctaSecondary")}
          </Link>
        </div>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-(--color-text-secondary)">
          <li>{tCommon("trustNoCadastro")}</li>
          <li>{tCommon("trustLanguages")}</li>
          <li>{tCommon("trustMinutes")}</li>
        </ul>
      </section>

      {/* Pain */}
      <section className="bg-(--color-muted)/40 border-y border-(--color-border)">
        <div className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-20">
          <h2 className="text-3xl md:text-4xl font-semibold text-(--color-text-primary) text-center">
            {copy.pain.title}
          </h2>
          <ul className="mt-8 flex flex-col gap-3 max-w-2xl mx-auto">
            {copy.pain.bullets.map((item, i) => (
              <li
                key={i}
                className="rounded-lg bg-(--color-background) border border-(--color-border) px-4 py-3 text-base text-(--color-text-primary)"
              >
                • {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <h2 className="text-3xl md:text-4xl font-semibold text-(--color-text-primary) text-center">
          {tCommon("benefitsTitle")}
        </h2>
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {copy.benefits.map((b, i) => (
            <li
              key={i}
              className="rounded-lg border border-(--color-border) bg-(--color-card) p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-xl font-semibold text-(--color-text-primary)">
                {b.title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-(--color-text-secondary)">
                {b.desc}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Scope */}
      <section className="bg-(--color-muted)/40 border-y border-(--color-border)">
        <div className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-20">
          <h2 className="text-3xl md:text-4xl font-semibold text-(--color-text-primary) text-center">
            {copy.scope.title}
          </h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 max-w-3xl mx-auto">
            {copy.scope.bullets.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg bg-(--color-background) border border-(--color-border) px-4 py-3 text-base text-(--color-text-primary)"
              >
                <span aria-hidden="true" className="text-(--color-primary)">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Use Cases */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <h2 className="text-3xl md:text-4xl font-semibold text-(--color-text-primary) text-center">
          {tCommon("useCasesTitle")}
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {copy.useCases.map((uc, i) => (
            <li
              key={i}
              className="rounded-lg border border-(--color-border) bg-(--color-card) p-5"
            >
              <h3 className="text-lg font-semibold text-(--color-text-primary)">
                {uc.title}
              </h3>
              <p className="mt-2 text-sm text-(--color-text-secondary) leading-relaxed">
                {uc.desc}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Stack */}
      <section className="bg-(--color-muted)/40 border-y border-(--color-border)">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <h2 className="text-3xl md:text-4xl font-semibold text-(--color-text-primary) text-center">
            {copy.stack.title}
          </h2>
          <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {copy.stack.options.map((s, i) => (
              <li
                key={i}
                className="rounded-lg border border-(--color-border) bg-(--color-background) p-5"
              >
                <h3 className="text-lg font-semibold text-(--color-text-primary)">
                  {s.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-(--color-text-secondary)">
                  {s.note}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-24">
        <h2 className="text-3xl md:text-4xl font-semibold text-(--color-text-primary) text-center">
          {tCommon("howItWorksTitle")}
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {copy.howItWorks.steps.map((step, i) => (
            <li
              key={i}
              className="rounded-lg border border-(--color-border) bg-(--color-card) p-6 text-center"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-(--color-primary) text-(--color-on-primary) text-lg font-bold">
                {i + 1}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-(--color-text-primary)">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-(--color-text-secondary)">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="bg-(--color-muted)/40 border-y border-(--color-border)">
        <div className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-20">
          <h2 className="text-3xl md:text-4xl font-semibold text-(--color-text-primary) text-center">
            {tCommon("faqTitle")}
          </h2>
          <div className="mt-8">
            <SolutionFAQClient items={copy.faq.map((f) => ({ q: f.q, a: f.a }))} />
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold text-(--color-text-primary)">
          {copy.ctaFinal.title}
        </h2>
        <p className="mt-4 text-lg text-(--color-text-secondary)">
          {copy.ctaFinal.desc}
        </p>
        <Link
          href={flowHref}
          locale={locale}
          data-testid="solution-cta-final"
          className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-md bg-(--color-primary) px-8 text-base font-semibold text-(--color-on-primary) shadow-sm hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2"
        >
          {copy.ctaFinal.button}
        </Link>
      </section>
    </>
  );
}
