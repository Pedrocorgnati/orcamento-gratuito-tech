import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@/lib/env"; // Valida variáveis de ambiente no startup
import { AnalyticsWithConsent } from "@/components/analytics/AnalyticsWithConsent";

// Camada 2: import via Client Component wrapper (dynamic ssr:false so requires client context)
import { DataTestOverlayLoader } from "@/components/dev/DataTestOverlayLoader";
import { ToastProvider } from "@/providers/ToastProvider";

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#4F46E5',
}

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
    icon: "/favicon.ico",
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
        <ToastProvider />
        {/* Analytics com consent gate — FEAT-UX-005 (wrapper isola beforeSend no cliente) */}
        <AnalyticsWithConsent />
        {/* Camada 3: condicional de ambiente — bundler elimina em producao (constante em build time) */}
        {process.env.NODE_ENV === "development" && <DataTestOverlayLoader />}
      </body>
    </html>
  );
}
