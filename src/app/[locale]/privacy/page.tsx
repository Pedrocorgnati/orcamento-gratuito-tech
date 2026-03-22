import { PublicLayout } from "@/components/layout";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Política de Privacidade",
};

const PRIVACY_SECTIONS: Record<
  string,
  { title: string; sections: Array<{ id: string; heading: string; content: string }> }
> = {
  "pt-BR": {
    title: "Política de Privacidade",
    sections: [
      {
        id: "data-collected",
        heading: "1. Dados Coletados",
        content:
          "Coletamos exclusivamente:\n• Email (voluntário, fornecido ao solicitar contato)\n• Respostas ao questionário de orçamento\n• Dados técnicos anonimizados (navegador, fuso horário — sem identificação pessoal)",
      },
      {
        id: "purpose",
        heading: "2. Finalidade do Tratamento",
        content:
          "Os dados são utilizados para:\n• Gerar e exibir a estimativa de orçamento solicitada\n• Enviar o resultado por email (apenas se fornecido)\n• Melhorar a precisão do motor de decisão de forma agregada e anonimizada",
      },
      {
        id: "rights",
        heading: "3. Direitos do Titular / GDPR",
        content:
          "Conforme a LGPD (Lei nº 13.709/2018) e o GDPR (Regulamento UE 2016/679), você tem direito a:\n• Acessar seus dados pessoais armazenados\n• Corrigir dados incompletos, inexatos ou desatualizados\n• Solicitar a exclusão dos seus dados\n• Revogar o consentimento a qualquer momento\n\nPara exercer esses direitos, entre em contato através do email abaixo.",
      },
      {
        id: "retention",
        heading: "4. Retenção de Dados",
        content:
          "• Sessões de orçamento: 7 dias (TTL automático)\n• Dados de lead com email: 12 meses, após os quais são anonimizados\n• Dados anonimizados: retidos indefinidamente para fins estatísticos",
      },
      {
        id: "contact",
        heading: "5. Contato — Encarregado (DPO)",
        content:
          "Para questões sobre privacidade, tratamento de dados ou para exercer seus direitos:\n\nEmail: privacidade@budgetfreeengine.com\n\nResponderemos em até 72 horas úteis.",
      },
    ],
  },
  "en-US": {
    title: "Privacy Policy",
    sections: [
      {
        id: "data-collected",
        heading: "1. Data Collected",
        content:
          "We collect exclusively:\n• Email (voluntary, provided when requesting contact)\n• Answers to the budget questionnaire\n• Anonymized technical data (browser, timezone — no personal identification)",
      },
      {
        id: "purpose",
        heading: "2. Purpose of Processing",
        content:
          "Data is used to:\n• Generate and display the requested budget estimate\n• Send the result by email (only if provided)\n• Improve decision engine accuracy in an aggregated and anonymized way",
      },
      {
        id: "rights",
        heading: "3. Data Subject Rights / GDPR",
        content:
          "Under LGPD (Law No. 13,709/2018) and GDPR (EU Regulation 2016/679), you have the right to:\n• Access your stored personal data\n• Correct incomplete, inaccurate, or outdated data\n• Request deletion of your data\n• Withdraw consent at any time\n\nTo exercise these rights, contact us at the email below.",
      },
      {
        id: "retention",
        heading: "4. Data Retention",
        content:
          "• Budget sessions: 7 days (automatic TTL)\n• Lead data with email: 12 months, after which it is anonymized\n• Anonymized data: retained indefinitely for statistical purposes",
      },
      {
        id: "contact",
        heading: "5. Contact — Data Protection Officer",
        content:
          "For privacy questions, data processing, or to exercise your rights:\n\nEmail: privacy@budgetfreeengine.com\n\nWe will respond within 72 business hours.",
      },
    ],
  },
};

// Fallback to pt-BR for es-ES and it-IT
PRIVACY_SECTIONS["es-ES"] = PRIVACY_SECTIONS["pt-BR"];
PRIVACY_SECTIONS["it-IT"] = PRIVACY_SECTIONS["pt-BR"];

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  const content = PRIVACY_SECTIONS[locale] ?? PRIVACY_SECTIONS["pt-BR"];
  const homeLabel = locale === "en-US" ? "Home" : "Início";
  const backLabel = locale === "en-US" ? "← Back to home" : "← Voltar ao início";
  const lastUpdated =
    locale === "en-US"
      ? "Last updated: March 21, 2026"
      : "Última atualização: 21 de março de 2026";
  const basedOn =
    locale === "en-US"
      ? "Based on LGPD (Law No. 13,709/2018) and GDPR"
      : "Baseada na LGPD (Lei nº 13.709/2018) e GDPR";
  const sectionsLabel = locale === "en-US" ? "Sections" : "Seções";

  return (
    <PublicLayout locale={locale as Locale}>
      <article data-testid="privacy-page" className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav data-testid="privacy-breadcrumb" aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <Link
                href="/"
                locale={locale as any}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {homeLabel}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-gray-900 dark:text-white">
              {content.title}
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-800">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            {content.title}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {lastUpdated}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{basedOn}</p>
        </header>

        {/* Index */}
        <nav
          data-testid="privacy-sections-nav"
          aria-label={sectionsLabel}
          className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
        >
          <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            {sectionsLabel}
          </p>
          <ol className="space-y-1">
            {content.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="space-y-8">
          {content.sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {section.heading}
              </h2>
              <div className="prose prose-sm prose-gray mt-3 dark:prose-invert max-w-none">
                {section.content.split("\n").map((line, i) => (
                  <p key={i} className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {line}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Back link */}
        <div className="mt-10 border-t border-gray-200 pt-6 dark:border-gray-800">
          <Link
            href="/"
            locale={locale as any}
            data-testid="privacy-back-link"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {backLabel}
          </Link>
        </div>
      </article>
    </PublicLayout>
  );
}
