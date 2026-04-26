import { PublicLayout } from "@/components/layout";
import { SolutionsHubGrid } from "@/components/solutions/SolutionsHubGrid";
import { routing, getLocalizedSolutionPath } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/routing";
import { generatePageMetadata } from "@/lib/metadata";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type PageProps = { params: Promise<{ locale: string }> };

export const revalidate = 86400;

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "solutions.hub" });
  const pathByLocale: Record<string, string> = {};
  for (const loc of routing.locales) {
    pathByLocale[loc] = getLocalizedSolutionPath("__hub__", loc);
  }
  return generatePageMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    locale,
    path: getLocalizedSolutionPath("__hub__", locale as AppLocale),
    pathByLocale,
  });
}

export default async function SolutionsHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const safeLocale = locale as AppLocale;

  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tHub = await getTranslations({ locale, namespace: "solutions.hub" });
  const tSol = await getTranslations({ locale, namespace: "solutions.common" });

  return (
    <PublicLayout
      locale={safeLocale}
      skipLinkLabel={tCommon("skipToContent")}
      privacyLabel={tCommon("privacyPolicy")}
      copyrightLabel={tCommon("copyright")}
      homeAriaLabel={tCommon("homeAriaLabel")}
      footerNavLabel={tCommon("footerNav")}
    >
      <div data-testid="page-solutions-hub">
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
                locale={safeLocale}
                className="hover:text-(--color-primary) transition-colors"
              >
                {tSol("breadcrumbHome")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-(--color-text-primary) font-medium">
              {tSol("breadcrumbHub")}
            </li>
          </ol>
        </nav>

        {/* Header */}
        <section className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-20 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-(--color-text-primary)">
            {tHub("title")}
          </h1>
          <p className="mt-5 text-lg md:text-xl text-(--color-text-secondary) max-w-2xl mx-auto">
            {tHub("subtitle")}
          </p>
        </section>

        {/* Grid */}
        <section className="mx-auto max-w-6xl px-4 pb-16 md:px-6 md:pb-24">
          <SolutionsHubGrid locale={safeLocale} />
        </section>

        {/* CTA final */}
        <section className="bg-(--color-muted)/40 border-y border-(--color-border)">
          <div className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-20 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-(--color-text-primary)">
              {tHub("ctaFinal")}
            </h2>
            <Link
              href="/flow"
              locale={safeLocale}
              className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-md bg-(--color-primary) px-8 text-base font-semibold text-(--color-on-primary) shadow-sm hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2"
            >
              {tHub("ctaFinalButton")}
            </Link>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
