import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { SOLUTIONS_BY_ORDER } from "@/lib/solutions/catalog";
import { getTranslations } from "next-intl/server";
import { SolutionIcon } from "@/components/layout/SolutionIcon";

export async function SolutionsHubGrid({ locale }: { locale: AppLocale }) {
  const tNav = await getTranslations({ locale, namespace: "nav.items" });
  const tHub = await getTranslations({ locale, namespace: "solutions.hub" });

  return (
    <ul
      data-testid="solutions-hub-grid"
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {SOLUTIONS_BY_ORDER.map((entry) => {
        const name = tNav(`${entry.slug}.name`);
        const pitch = tNav(`${entry.slug}.shortPitch`);
        return (
          <li key={entry.slug}>
            <Link
              href={{
                pathname: "/solucoes/[slug]",
                params: { slug: entry.slug },
              }}
              locale={locale}
              data-testid="solution-card"
              className="group flex h-full flex-col gap-3 rounded-lg border border-(--color-border) bg-(--color-card) p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)"
            >
              <SolutionIcon
                iconKey={entry.iconKey}
                className="h-8 w-8 text-(--color-primary)"
              />
              <h2 className="text-xl font-semibold text-(--color-text-primary)">
                {name}
              </h2>
              <p className="flex-1 text-sm leading-relaxed text-(--color-text-secondary)">
                {pitch}
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-(--color-primary) group-hover:gap-2 transition-all">
                {tHub("learnMore")} →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
