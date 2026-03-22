import { PublicLayout } from "@/components/layout";
import { HeroSection } from "./_components/HeroSection";
import { FeaturesSection } from "./_components/FeaturesSection";
import { SocialProofSection } from "./_components/SocialProofSection";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 86400; // ISR: 24 horas

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Budget Free Engine — Calcule o orçamento do seu projeto",
    description:
      "Calcule o orçamento do seu projeto de software em minutos. 42 perguntas inteligentes, estimativa instantânea, 100% gratuito.",
    openGraph: {
      title: "Budget Free Engine",
      description: "Calcule o orçamento do seu projeto de software em minutos.",
      // @ASSET_PLACEHOLDER name: og-image type: image extension: jpg format: 1200:630 dimensions: 1200x630 description: OG Image do Budget Free Engine para compartilhamento em redes sociais. Design limpo com logo, headline 'Calcule o orçamento do seu projeto em minutos' e elementos visuais representando estimativas de software. style: Profissional, tipografia clara, fundo gradient azul/branco. colors: primary (#4F46E5), background (#FFFFFF), text (#111827) context: LinkedIn, Twitter, WhatsApp preview cards
      images: [
        {
          url: "/images/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Budget Free Engine — Calcule o orçamento do seu projeto de software em minutos",
        },
      ],
    },
  };
}

export default async function LandingPage({ params }: PageProps) {
  const { locale } = await params;
  const safeLocale = locale as Locale;

  return (
    <PublicLayout locale={safeLocale}>
      <HeroSection locale={safeLocale} />
      <FeaturesSection locale={safeLocale} />
      <SocialProofSection locale={safeLocale} />
    </PublicLayout>
  );
}
