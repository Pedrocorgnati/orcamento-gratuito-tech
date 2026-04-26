import { PublicLayout } from "@/components/layout";
import { HeroSection } from "./_components/HeroSection";
import { FeaturesSection } from "./_components/FeaturesSection";
import { SocialProofSection } from "./_components/SocialProofSection";
import { SolutionsHubGrid } from "@/components/solutions/SolutionsHubGrid";
import { Link } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/routing";
import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";
import { getWebApplicationSchema, getFAQSchema } from "@/lib/seo/jsonld";

type PageProps = {
  params: Promise<{ locale: string }>;
};

// ISR: revalida a cada 24 horas
export const revalidate = 86400;

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });
  return generatePageMetadata({
    title: `${t("title")} ${t("titleHighlight")} | Budget Free Engine`,
    description: t("subtitle"),
    locale,
    path: "/",
  });
}

export default async function LandingPage({ params }: PageProps) {
  const { locale } = await params;
  const safeLocale = locale as AppLocale;

  // Habilita SSG com setRequestLocale (necessário no next-intl para RSC)
  setRequestLocale(locale);

  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <>
      {/* JSON-LD: WebApplication schema — FEAT-UX-004 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getWebApplicationSchema(locale)) }}
      />
      {/* JSON-LD: FAQPage schema — INT-105 SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getFAQSchema(locale)) }}
      />
      <PublicLayout
        locale={safeLocale}
        skipLinkLabel={tCommon("skipToContent")}
        logoutLabel={tCommon("admin.logout")}
        privacyLabel={tCommon("privacyPolicy")}
        copyrightLabel={tCommon("copyright")}
        homeAriaLabel={tCommon("homeAriaLabel")}
        footerNavLabel={tCommon("footerNav")}
      >
        <div data-testid="page-home">
          <HeroSection locale={safeLocale} />
          <FeaturesSection locale={safeLocale} />
          <section
            data-testid="home-solutions-section"
            className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24"
          >
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-semibold text-(--color-text-primary)">
                {(await getTranslations({ locale, namespace: "solutions.hub" }))(
                  "title",
                )}
              </h2>
              <p className="mt-4 text-lg text-(--color-text-secondary) max-w-2xl mx-auto">
                {(await getTranslations({ locale, namespace: "solutions.hub" }))(
                  "subtitle",
                )}
              </p>
            </div>
            <div className="mt-10">
              <SolutionsHubGrid locale={safeLocale} />
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/solucoes"
                locale={safeLocale}
                className="inline-flex min-h-[44px] items-center gap-1 rounded-md border border-(--color-border) px-5 text-sm font-medium text-(--color-text-primary) hover:bg-(--color-muted) transition-colors"
              >
                {(await getTranslations({ locale, namespace: "nav" }))(
                  "allSolutions",
                )}{" "}
                →
              </Link>
            </div>
          </section>
          <SocialProofSection locale={safeLocale} />
        </div>
      </PublicLayout>
    </>
  );
}
