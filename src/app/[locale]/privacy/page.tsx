import { PublicLayout } from "@/components/layout";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/routing";
import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const revalidate = 86400;

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return generatePageMetadata({
    title: t("privacyPolicy"),
    description: t("privacyPolicy"),
    locale,
    path: "/privacy",
  });
}

// ---------------------------------------------------------------------------
// Conteúdo legal estático por locale
// Decisão arquitetural: conteúdo legal não deve ser editável por CMS sem revisão jurídica.
// pt-BR → LGPD (Lei 13.709/2018); demais → GDPR (Regulamento UE 2016/679).
// ---------------------------------------------------------------------------

const PRIVACY_SECTIONS: Record<
  string,
  {
    title: string;
    lastUpdated: string;
    framework: string;
    sections: Array<{ id: string; heading: string; content: string }>;
  }
> = {
  "pt-BR": {
    title: "Política de Privacidade",
    lastUpdated: "21 de março de 2026",
    framework: "LGPD (Lei nº 13.709/2018)",
    sections: [
      {
        id: "data-collected",
        heading: "1. Dados Coletados",
        content: `Coletamos exclusivamente:
• **Endereço de email**: fornecido voluntariamente no formulário de captura de leads, para envio do orçamento detalhado.
• **Respostas ao questionário**: dados sobre o projeto de software (tipo, funcionalidades, prazo), armazenados temporariamente para geração do orçamento.
• **Dados técnicos**: endereço IP (anonimizado), tipo de navegador e idioma preferido para detecção automática de locale.

Não coletamos dados sensíveis conforme definidos no Art. 5º, inciso II da LGPD.`,
      },
      {
        id: "purpose",
        heading: "2. Finalidade do Tratamento",
        content: `Os dados são utilizados exclusivamente para:
• **Geração do orçamento**: processamento das respostas para calcular estimativa de custo.
• **Envio por email**: entrega do orçamento detalhado ao endereço fornecido (base legal: consentimento — Art. 7º, I da LGPD).
• **Melhoria do serviço**: análise agregada e anonimizada de padrões de uso (base legal: legítimo interesse — Art. 7º, IX da LGPD).

Não utilizamos os dados para marketing direto sem consentimento adicional explícito.`,
      },
      {
        id: "rights",
        heading: "3. Direitos do Titular",
        content: `Conforme a LGPD, você tem direito a:
• **Acesso**: solicitar confirmação da existência e acesso aos seus dados (Art. 18, I e II).
• **Correção**: corrigir dados incompletos, inexatos ou desatualizados (Art. 18, III).
• **Exclusão**: solicitar a eliminação dos dados tratados com consentimento (Art. 18, VI).
• **Portabilidade**: receber seus dados em formato estruturado (Art. 18, V).
• **Revogação**: revogar o consentimento a qualquer momento (Art. 18, IX).

Para exercer seus direitos, entre em contato via email abaixo.`,
      },
      {
        id: "retention",
        heading: "4. Retenção de Dados",
        content: `• **Respostas do questionário**: eliminadas automaticamente após 30 dias se nenhum email for fornecido.
• **Email + orçamento**: retidos por até 12 meses para permitir reenvio, após o que são eliminados ou anonimizados.
• **Logs técnicos**: retidos por 90 dias para fins de segurança, conforme Art. 15, §1º do Marco Civil da Internet.`,
      },
      {
        id: "contact",
        heading: "5. Contato — Encarregado (DPO)",
        content: `Para dúvidas, solicitações ou exercício de direitos:

**Email:** privacidade@budgetfreeengine.com
**Prazo de resposta:** até 15 dias úteis, conforme Art. 18, §3º da LGPD.`,
      },
    ],
  },
  "en-US": {
    title: "Privacy Policy",
    lastUpdated: "March 21, 2026",
    framework: "GDPR (Regulation EU 2016/679)",
    sections: [
      {
        id: "data-collected",
        heading: "1. Data Collected",
        content: `We collect exclusively:
• **Email address**: voluntarily provided in the lead capture form, for sending the detailed budget.
• **Questionnaire answers**: project data (type, features, timeline), temporarily stored for budget generation.
• **Technical data**: IP address (anonymized), browser type, and preferred language for locale detection.

We do not collect special categories of personal data as defined in Article 9 GDPR.`,
      },
      {
        id: "purpose",
        heading: "2. Purpose of Processing",
        content: `Data is used exclusively for:
• **Budget generation**: processing answers to calculate cost estimates (legal basis: performance of a contract — Art. 6(1)(b) GDPR).
• **Email delivery**: sending the detailed budget to the provided address (legal basis: consent — Art. 6(1)(a) GDPR).
• **Service improvement**: aggregated, anonymized analysis of usage patterns (legal basis: legitimate interests — Art. 6(1)(f) GDPR).`,
      },
      {
        id: "rights",
        heading: "3. Your Rights (GDPR)",
        content: `Under the GDPR, you have the right to:
• **Access**: request confirmation and access to your personal data (Art. 15).
• **Rectification**: correct inaccurate or incomplete data (Art. 16).
• **Erasure**: request deletion of your data ("right to be forgotten") (Art. 17).
• **Portability**: receive your data in a structured, machine-readable format (Art. 20).
• **Withdraw consent**: at any time, without affecting prior processing (Art. 7(3)).
• **Lodge a complaint**: with your supervisory authority (Art. 77).`,
      },
      {
        id: "retention",
        heading: "4. Data Retention",
        content: `• **Questionnaire answers**: automatically deleted after 30 days if no email is provided.
• **Email + budget**: retained for up to 12 months, then deleted or anonymized.
• **Technical logs**: retained for 90 days for security purposes.`,
      },
      {
        id: "contact",
        heading: "5. Contact — Data Controller",
        content: `For questions, requests, or to exercise your rights:

**Email:** privacy@budgetfreeengine.com
**Response time:** within 30 days, as required by Art. 12 GDPR.`,
      },
    ],
  },
  "es-ES": {
    title: "Política de Privacidad",
    lastUpdated: "21 de marzo de 2026",
    framework: "RGPD (Reglamento UE 2016/679)",
    sections: [
      {
        id: "data-collected",
        heading: "1. Datos Recopilados",
        content: `Recopilamos exclusivamente:
• **Dirección de correo electrónico**: proporcionada voluntariamente en el formulario de captura de leads, para el envío del presupuesto detallado.
• **Respuestas al cuestionario**: datos sobre el proyecto de software (tipo, funcionalidades, plazo), almacenados temporalmente para la generación del presupuesto.
• **Datos técnicos**: dirección IP (anonimizada), tipo de navegador e idioma preferido para la detección automática de locale.

No recopilamos categorías especiales de datos personales según el Art. 9 del RGPD.`,
      },
      {
        id: "purpose",
        heading: "2. Finalidad del Tratamiento",
        content: `Los datos se utilizan exclusivamente para:
• **Generación del presupuesto**: procesamiento de las respuestas para calcular la estimación de costes (base legal: ejecución de contrato — Art. 6(1)(b) RGPD).
• **Envío por email**: entrega del presupuesto detallado a la dirección proporcionada (base legal: consentimiento — Art. 6(1)(a) RGPD).
• **Mejora del servicio**: análisis agregado y anonimizado de patrones de uso (base legal: interés legítimo — Art. 6(1)(f) RGPD).`,
      },
      {
        id: "rights",
        heading: "3. Sus Derechos (RGPD)",
        content: `Conforme al RGPD, usted tiene derecho a:
• **Acceso**: solicitar confirmación y acceso a sus datos personales (Art. 15).
• **Rectificación**: corregir datos inexactos o incompletos (Art. 16).
• **Supresión**: solicitar la eliminación de sus datos ("derecho al olvido") (Art. 17).
• **Portabilidad**: recibir sus datos en formato estructurado y legible por máquina (Art. 20).
• **Retirada del consentimiento**: en cualquier momento, sin afectar el tratamiento previo (Art. 7(3)).
• **Reclamación**: presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD) (Art. 77).`,
      },
      {
        id: "retention",
        heading: "4. Conservación de Datos",
        content: `• **Respuestas del cuestionario**: eliminadas automáticamente tras 30 días si no se proporciona email.
• **Email + presupuesto**: conservados hasta 12 meses, tras lo cual se eliminan o anonimizan.
• **Logs técnicos**: conservados durante 90 días por motivos de seguridad.`,
      },
      {
        id: "contact",
        heading: "5. Contacto — Responsable del Tratamiento",
        content: `Para consultas, solicitudes o para ejercer sus derechos:

**Email:** privacidad@budgetfreeengine.com
**Plazo de respuesta:** 30 días según Art. 12 RGPD.`,
      },
    ],
  },
  "it-IT": {
    title: "Informativa sulla Privacy",
    lastUpdated: "21 marzo 2026",
    framework: "GDPR (Regolamento UE 2016/679)",
    sections: [
      {
        id: "data-collected",
        heading: "1. Dati Raccolti",
        content: `Raccogliamo esclusivamente:
• **Indirizzo email**: fornito volontariamente nel modulo di acquisizione lead, per l'invio del preventivo dettagliato.
• **Risposte al questionario**: dati sul progetto software (tipo, funzionalità, tempistica), archiviati temporaneamente per la generazione del preventivo.
• **Dati tecnici**: indirizzo IP (anonimizzato), tipo di browser e lingua preferita per il rilevamento automatico del locale.

Non raccogliamo categorie particolari di dati personali ai sensi dell'Art. 9 GDPR.`,
      },
      {
        id: "purpose",
        heading: "2. Finalità del Trattamento",
        content: `I dati sono utilizzati esclusivamente per:
• **Generazione del preventivo**: elaborazione delle risposte per calcolare la stima dei costi (base legale: esecuzione di un contratto — Art. 6(1)(b) GDPR).
• **Invio via email**: consegna del preventivo dettagliato all'indirizzo fornito (base legale: consenso — Art. 6(1)(a) GDPR).
• **Miglioramento del servizio**: analisi aggregata e anonimizzata dei modelli di utilizzo (base legale: legittimo interesse — Art. 6(1)(f) GDPR).`,
      },
      {
        id: "rights",
        heading: "3. I Suoi Diritti (GDPR)",
        content: `Ai sensi del GDPR, Lei ha diritto a:
• **Accesso**: richiedere conferma e accesso ai Suoi dati personali (Art. 15).
• **Rettifica**: correggere dati inesatti o incompleti (Art. 16).
• **Cancellazione**: richiedere la cancellazione dei Suoi dati ("diritto all'oblio") (Art. 17).
• **Portabilità**: ricevere i Suoi dati in formato strutturato e leggibile da macchina (Art. 20).
• **Revoca del consenso**: in qualsiasi momento, senza pregiudizio per il trattamento precedente (Art. 7(3)).
• **Reclamo**: presentare reclamo al Garante per la Protezione dei Dati Personali (Art. 77).`,
      },
      {
        id: "retention",
        heading: "4. Conservazione dei Dati",
        content: `• **Risposte al questionario**: eliminate automaticamente dopo 30 giorni se non viene fornito un email.
• **Email + preventivo**: conservati fino a 12 mesi, dopodiché vengono eliminati o anonimizzati.
• **Log tecnici**: conservati per 90 giorni per motivi di sicurezza.`,
      },
      {
        id: "contact",
        heading: "5. Contatto — Titolare del Trattamento",
        content: `Per domande, richieste o per esercitare i Suoi diritti:

**Email:** privacy@budgetfreeengine.com
**Tempo di risposta:** 30 giorni ai sensi dell'Art. 12 GDPR.`,
      },
    ],
  },
};

type LocaleKey = keyof typeof PRIVACY_SECTIONS;

// ---------------------------------------------------------------------------
// Locale-specific labels
// ---------------------------------------------------------------------------
const LABELS: Record<string, { home: string; back: string; lastUpdated: string; basedOn: string; sections: string }> = {
  "pt-BR": { home: "Início", back: "← Voltar ao início", lastUpdated: "Última atualização", basedOn: "Baseada na", sections: "Seções" },
  "en-US": { home: "Home", back: "← Back to home", lastUpdated: "Last updated", basedOn: "Based on", sections: "Sections" },
  "es-ES": { home: "Inicio", back: "← Volver al inicio", lastUpdated: "Última actualización", basedOn: "Basada en", sections: "Secciones" },
  "it-IT": { home: "Home", back: "← Torna alla home", lastUpdated: "Ultimo aggiornamento", basedOn: "Basata su", sections: "Sezioni" },
};

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const content = PRIVACY_SECTIONS[locale as LocaleKey] ?? PRIVACY_SECTIONS["pt-BR"];
  const labels = LABELS[locale] ?? LABELS["pt-BR"];

  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <PublicLayout
      locale={locale as AppLocale}
      skipLinkLabel={tCommon("skipToContent")}
      loginLabel={tCommon("admin.login")}
      logoutLabel={tCommon("admin.logout")}
      privacyLabel={tCommon("privacyPolicy")}
      copyrightLabel={tCommon("copyright")}
      homeAriaLabel={tCommon("homeAriaLabel")}
      footerNavLabel={tCommon("footerNav")}
    >
      <article data-testid="privacy-page" className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav data-testid="privacy-breadcrumb" aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-(--color-text-muted)">
            <li>
              <Link
                href="/"
                locale={locale as AppLocale}
                className="text-(--color-primary) hover:underline"
              >
                {labels.home}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-(--color-text-primary)">
              {content.title}
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-8 border-b border-(--color-border) pb-6">
          <h1 className="text-3xl font-bold text-(--color-text-primary) sm:text-4xl">
            {content.title}
          </h1>
          <p className="mt-2 text-sm text-(--color-text-muted)">
            {labels.lastUpdated}: {content.lastUpdated}
          </p>
          <p className="text-sm text-(--color-text-muted)">
            {labels.basedOn} {content.framework}
          </p>
        </header>

        {/* Index */}
        <nav
          data-testid="privacy-sections-nav"
          aria-label={labels.sections}
          className="mb-8 rounded-lg border border-(--color-border) bg-(--color-surface) p-4"
        >
          <p className="mb-2 text-sm font-semibold text-(--color-text-secondary)">
            {labels.sections}
          </p>
          <ol className="space-y-1">
            {content.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-(--color-primary) hover:underline"
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
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
            >
              <h2
                id={`${section.id}-title`}
                className="text-xl font-semibold text-(--color-text-primary)"
              >
                {section.heading}
              </h2>
              <div className="prose prose-sm prose-gray mt-3 dark:prose-invert max-w-none">
                {section.content.split("\n").map((line, i) => (
                  <p
                    key={i}
                    className="text-sm leading-relaxed text-(--color-text-secondary)"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Back link */}
        <div className="mt-10 border-t border-(--color-border) pt-6">
          <Link
            href="/"
            locale={locale as AppLocale}
            data-testid="privacy-back-link"
            className="text-sm text-(--color-primary) hover:underline"
          >
            {labels.back}
          </Link>
        </div>
      </article>
    </PublicLayout>
  );
}
