import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import {
  SOLUTIONS_BY_ORDER,
  type SolutionSlug,
} from "@/lib/solutions/catalog";
import {
  MegaNavbarClient,
  type MegaNavbarLabels,
  type MegaNavbarSolutionItem,
} from "./MegaNavbarClient";

export async function MegaNavbar({ locale }: { locale: AppLocale }) {
  const t = await getTranslations({ locale, namespace: "nav" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const labels: MegaNavbarLabels = {
    logo: t("logo"),
    solutions: t("solutions"),
    solutionsAriaLabel: t("solutionsAriaLabel"),
    howItWorks: t("howItWorks"),
    ctaQuote: t("ctaQuote"),
    allSolutions: t("allSolutions"),
    openMenu: t("openMenu"),
    closeMenu: t("closeMenu"),
    homeAriaLabel: tCommon("homeAriaLabel"),
  };

  const solutionItems: MegaNavbarSolutionItem[] = SOLUTIONS_BY_ORDER.map(
    (entry) => ({
      slug: entry.slug as SolutionSlug,
      iconKey: entry.iconKey,
      name: t(`items.${entry.slug}.name`),
      shortPitch: t(`items.${entry.slug}.shortPitch`),
    }),
  );

  return (
    <MegaNavbarClient
      locale={locale}
      labels={labels}
      solutionItems={solutionItems}
    />
  );
}
