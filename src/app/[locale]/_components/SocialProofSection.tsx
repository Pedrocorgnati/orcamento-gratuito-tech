import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

interface SocialProofSectionProps {
  locale: Locale;
}

export async function SocialProofSection({ locale }: SocialProofSectionProps) {
  const t = await getTranslations({ locale, namespace: "landing" });

  const testimonials = [
    {
      quote: t("testimonial1Quote"),
      author: t("testimonial1Author"),
      role: t("testimonial1Role"),
    },
    {
      quote: t("testimonial2Quote"),
      author: t("testimonial2Author"),
      role: t("testimonial2Role"),
    },
    {
      quote: t("testimonial3Quote"),
      author: t("testimonial3Author"),
      role: t("testimonial3Role"),
    },
  ];

  return (
    <section
      data-testid="social-proof-section"
      aria-labelledby="social-proof-headline"
      className="bg-blue-600 dark:bg-blue-800 px-4 py-12 sm:py-16"
    >
      <div className="mx-auto max-w-4xl text-center">
        {/* Counter */}
        <p
          id="social-proof-headline"
          data-testid="social-proof-counter"
          className="text-5xl font-bold text-white sm:text-6xl"
        >
          {t("socialCounter")}
        </p>
        <p className="mt-2 text-lg text-blue-100 sm:text-xl">
          {t("socialCounterLabel")}
        </p>

        {/* Testimonials */}
        <div data-testid="social-proof-testimonials" className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <blockquote
              key={item.author}
              data-testid={`testimonial-card-${index}`}
              className="rounded-lg bg-white/10 p-4 text-left backdrop-blur-sm"
            >
              <p className="text-sm text-white/90">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-3">
                <cite className="not-italic text-xs text-blue-200">
                  — {item.author}, {item.role}
                </cite>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
