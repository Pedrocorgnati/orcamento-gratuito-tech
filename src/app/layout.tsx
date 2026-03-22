import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Camada 2: import via Client Component wrapper (dynamic ssr:false so requires client context)
import { DataTestOverlayLoader } from "@/components/dev/DataTestOverlayLoader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://budgetfreeengine.com"
  ),
  title: {
    default: "Budget Free Engine",
    template: "%s | Budget Free Engine",
  },
  description:
    "Calcule o orçamento do seu projeto de software em minutos. 42 perguntas inteligentes, estimativa instantânea, 100% gratuito.",
  icons: {
    // @ASSET_PLACEHOLDER name: favicon type: image extension: ico format: 1:1 dimensions: 32x32 description: Favicon do Budget Free Engine com símbolo reduzido. Forma geométrica abstrata com ícone de raio/energia representando velocidade e precisão. style: Minimalista, monocromático, legível em 32px. colors: primary (#4F46E5), background (#FFFFFF) context: Browser tab, PWA icon
    icon: "/favicon.ico",
    // @ASSET_PLACEHOLDER name: apple-icon type: image extension: png format: 1:1 dimensions: 180x180 description: Apple touch icon do Budget Free Engine. Mesmo símbolo do favicon em alta resolução para dispositivos iOS. style: Minimalista, ícone com fundo sólido. colors: primary (#4F46E5), background (#FFFFFF) context: iOS home screen, Apple devices
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 font-[var(--font-inter)]">
        {children}
        {/* Camada 3: condicional de ambiente — bundler elimina em producao (constante em build time) */}
        {process.env.NODE_ENV === "development" && <DataTestOverlayLoader />}
      </body>
    </html>
  );
}
