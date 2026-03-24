import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SessionStatus } from '@/lib/enums'
import { COOKIE_NAMES } from '@/lib/constants'
import { LeadCaptureForm } from '@/components/lead'
import { LeadCaptureViewTracker } from '@/components/analytics/LeadCaptureViewTracker'
import { MobileHeader } from '@/components/mobile/MobileHeader'

interface LeadCapturePageProps {
  params: Promise<{ locale: string }>
}

const PAGE_CONTENT: Record<string, { title: string; subtitle: string }> = {
  'pt-BR': {
    title: 'Receba sua análise completa',
    subtitle: 'Preencha seus dados para receber a estimativa detalhada por email.',
  },
  'en-US': {
    title: 'Get your full analysis',
    subtitle: 'Fill in your details to receive the detailed estimate by email.',
  },
  'es-ES': {
    title: 'Recibe tu análisis completo',
    subtitle: 'Completa tus datos para recibir la estimación detallada por email.',
  },
  'it-IT': {
    title: 'Ricevi la tua analisi completa',
    subtitle: 'Compila i tuoi dati per ricevere la stima dettagliata via email.',
  },
}

export default async function LeadCapturePage({ params }: LeadCapturePageProps) {
  const { locale } = await params
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(COOKIE_NAMES.SESSION_ID)

  // Sem cookie → redirect para o fluxo (LEAD_080)
  if (!sessionCookie?.value) {
    redirect(`/${locale}/flow`)
  }

  // Verificar status da sessão
  const session = await prisma.session.findUnique({
    where: { id: sessionCookie.value },
    select: { id: true, status: true },
  })

  // Sessão não existe (LEAD_080) ou incompleta (LEAD_050) → redirect
  if (!session || session.status !== SessionStatus.COMPLETED) {
    redirect(`/${locale}/flow`)
  }

  const content = PAGE_CONTENT[locale] ?? PAGE_CONTENT['en-US']!

  return (
    <>
      <MobileHeader title="Budget Free Engine" showBack />
      <main className="min-h-screen bg-gray-50 py-8 px-4 md:py-16">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {content.title}
            </h1>
            <p className="text-gray-500 mt-2">
              {content.subtitle}
            </p>
          </div>

          <LeadCaptureViewTracker />
          <LeadCaptureForm
            sessionId={session.id}
            locale={locale}
          />
        </div>
      </main>
    </>
  )
}

export async function generateMetadata({ params }: LeadCapturePageProps) {
  const { locale } = await params
  const TITLES: Record<string, string> = {
    'pt-BR': 'Receba sua Análise Completa | Budget Free',
    'en-US': 'Get Your Full Analysis | Budget Free',
    'es-ES': 'Recibe tu Análisis Completo | Budget Free',
    'it-IT': 'Ricevi la tua Analisi Completa | Budget Free',
  }
  const DESCRIPTIONS: Record<string, string> = {
    'pt-BR': 'Preencha seus dados para receber a estimativa detalhada do seu projeto por email.',
    'en-US': 'Fill in your details to receive the detailed estimate for your project by email.',
    'es-ES': 'Completa tus datos para recibir la estimación detallada de tu proyecto por email.',
    'it-IT': 'Compila i tuoi dati per ricevere la stima dettagliata del tuo progetto via email.',
  }
  return {
    title: TITLES[locale] ?? TITLES['pt-BR'],
    description: DESCRIPTIONS[locale] ?? DESCRIPTIONS['pt-BR'],
    robots: { index: false, follow: false },
  }
}
