import { PublicLayout } from "@/components/layout";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: "Calcular Orçamento",
};

// TODO: Implementar módulo decision-engine-ui (module-8)
export default async function FlowPage({ params }: PageProps) {
  const { locale } = await params;
  const safeLocale = locale as Locale;

  return (
    <PublicLayout locale={safeLocale}>
      <div data-testid="flow-page" className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">
          🚀
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          Motor de Decisão
        </h1>
        <p className="mt-3 max-w-md text-gray-600 dark:text-gray-400">
          Esta seção está em desenvolvimento. O fluxo de perguntas interativo
          será implementado em breve.
        </p>
        {/* RESOLVED: <Link><Button> → <Link className> direto */}
        <div className="mt-6">
          <Link
            href="/"
            locale={safeLocale}
            data-testid="flow-back-button"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border-2 border-blue-600 px-6 text-base font-medium text-blue-600 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
