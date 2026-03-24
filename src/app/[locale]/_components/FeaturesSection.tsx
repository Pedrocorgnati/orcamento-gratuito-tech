import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

interface FeaturesSectionProps {
  locale: AppLocale;
}

const features = [
  {
    icon: "🌳",
    titleKey: "featureTree",
    descKey: "featureTreeDesc",
  },
  {
    icon: "⚡",
    titleKey: "featureInstant",
    descKey: "featureInstantDesc",
  },
  {
    icon: "🌍",
    titleKey: "featureMultilingual",
    descKey: "featureMultilingualDesc",
  },
];

export async function FeaturesSection({ locale }: FeaturesSectionProps) {
  const t = await getTranslations({ locale, namespace: "landing" });

  return (
    <section
      data-testid="features-section"
      aria-labelledby="features-headline"
      className="bg-(--color-background) px-4 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <h2
            id="features-headline"
            data-testid="features-headline"
            className="text-2xl font-bold text-(--color-text-primary) sm:text-3xl"
          >
            {t("featuresTitle")}
          </h2>
          <p className="mt-2 text-(--color-text-secondary)">
            {t("featuresSubtitle")}
          </p>
        </div>

        <div data-testid="features-grid" className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.titleKey}
              data-testid={`feature-card-${feature.titleKey}`}
              className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 text-center transition-shadow hover:shadow-md"
            >
              <div className="text-4xl mb-4" aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-(--color-text-primary)">
                {t(feature.titleKey as Parameters<typeof t>[0])}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-(--color-text-secondary)">
                {t(feature.descKey as Parameters<typeof t>[0])}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
