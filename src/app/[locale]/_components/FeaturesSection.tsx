import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

interface FeaturesSectionProps {
  locale: Locale;
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
      className="bg-white dark:bg-gray-950 px-4 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <h2
            id="features-headline"
            data-testid="features-headline"
            className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white"
          >
            {t("featuresTitle")}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t("featuresSubtitle")}
          </p>
        </div>

        <div data-testid="features-grid" className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.titleKey}
              data-testid={`feature-card-${feature.titleKey}`}
              className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="text-4xl mb-4" aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t(feature.titleKey as any)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t(feature.descKey as any)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
