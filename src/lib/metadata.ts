import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

const APP_URL = (() => {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "https://orcamentogratuito.tech";
  return url.replace(/\/$/, "");
})();

interface PageMetadataOptions {
  title: string;
  description: string;
  locale: string;
  /** Caminho da rota sem locale, ex: "/" ou "/privacy" */
  path: string;
  /** URL customizada de OG image. Padrão: /og-image.jpg */
  ogImageUrl?: string;
  /** true para /admin, /result, /lead-capture, /thank-you */
  noIndex?: boolean;
  /**
   * Mapa locale → path para hreflang (usado quando slug/segment muda por locale).
   * Se ausente, usa `path` para todos os locales.
   */
  pathByLocale?: Record<string, string>;
}

/**
 * Gera metadata com hreflang alternates, OG image e Twitter card.
 * Usar em generateMetadata() das pages SSG do module-4.
 * Enriquecido no module-16 com OG/Twitter/noIndex.
 */
export function generatePageMetadata({
  title,
  description,
  locale,
  path,
  ogImageUrl,
  noIndex = false,
  pathByLocale,
}: PageMetadataOptions): Metadata {
  const pathFor = (loc: string) => {
    const p = pathByLocale?.[loc] ?? path;
    return p === "/" ? "" : p;
  };
  const canonicalUrl = `${APP_URL}/${locale}${pathFor(locale)}`;
  const ogImage = ogImageUrl ?? `${APP_URL}/images/og-image.jpg`;

  // hreflang alternates para SEO multilíngue
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${APP_URL}/${loc}${pathFor(loc)}`;
  }
  languages["x-default"] = `${APP_URL}/${routing.defaultLocale}${pathFor(routing.defaultLocale)}`;

  return {
    title,
    description,
    metadataBase: new URL(APP_URL),
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Orçamento Gratuito Tech",
      locale: locale.replace("-", "_"),
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => l.replace("-", "_")),
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
