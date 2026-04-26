import { PublicLayout } from "@/components/layout";
import { SolutionLandingTemplate } from "@/components/solutions/SolutionLandingTemplate";
import { routing, getLocalizedSolutionPath } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/routing";
import { generatePageMetadata } from "@/lib/metadata";
import { SOLUTION_SLUGS, isSolutionSlug } from "@/lib/solutions/catalog";
import { getSolutionCopy } from "@/lib/solutions/copy";
import {
  getSolutionServiceSchema,
  getBreadcrumbSchema,
  getSolutionFAQSchema,
} from "@/lib/seo/jsonld";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://orcamentogratuito.tech").replace(/\/$/, "");

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export const revalidate = 86400;

export async function generateStaticParams() {
  const out: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of SOLUTION_SLUGS) {
      out.push({ locale, slug });
    }
  }
  return out;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isSolutionSlug(slug)) return {};
  const safeLocale = locale as AppLocale;
  const copy = getSolutionCopy(safeLocale, slug);
  const pathByLocale: Record<string, string> = {};
  for (const loc of routing.locales) {
    pathByLocale[loc] = getLocalizedSolutionPath(slug, loc);
  }
  return generatePageMetadata({
    title: copy.meta.title,
    description: copy.meta.description,
    locale,
    path: getLocalizedSolutionPath(slug, safeLocale),
    pathByLocale,
  });
}

export default async function SolutionSlugPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isSolutionSlug(slug)) notFound();
  setRequestLocale(locale);
  const safeLocale = locale as AppLocale;

  const tCommon = await getTranslations({ locale, namespace: "common" });
  const tSol = await getTranslations({ locale, namespace: "solutions.common" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const copy = getSolutionCopy(safeLocale, slug);

  const slugUrl = `${APP_URL}/${safeLocale}${getLocalizedSolutionPath(slug, safeLocale)}`;
  const hubUrl = `${APP_URL}/${safeLocale}${getLocalizedSolutionPath("__hub__", safeLocale)}`;
  const homeUrl = `${APP_URL}/${safeLocale}`;

  const serviceSchema = getSolutionServiceSchema({
    name: copy.meta.title,
    description: copy.meta.description,
    url: slugUrl,
    locale: safeLocale,
  });
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: tSol("breadcrumbHome"), url: homeUrl },
    { name: tSol("breadcrumbHub"), url: hubUrl },
    { name: tNav(`items.${slug}.name`), url: slugUrl },
  ]);
  const faqSchema = getSolutionFAQSchema(copy.faq);

  return (
    <PublicLayout
      locale={safeLocale}
      skipLinkLabel={tCommon("skipToContent")}
      privacyLabel={tCommon("privacyPolicy")}
      copyrightLabel={tCommon("copyright")}
      homeAriaLabel={tCommon("homeAriaLabel")}
      footerNavLabel={tCommon("footerNav")}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div data-testid="page-solution-slug">
        <SolutionLandingTemplate slug={slug} locale={safeLocale} />
      </div>
    </PublicLayout>
  );
}
