import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ThankYouMessage } from '@/components/lead/ThankYouMessage'
import { COOKIE_NAMES } from '@/lib/constants'

interface ThankYouPageProps {
  params: Promise<{ locale: string }>
}

export default async function ThankYouPage({ params }: ThankYouPageProps) {
  const { locale } = await params
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(COOKIE_NAMES.SESSION_ID)

  // Sem cookie → redirect para home
  if (!sessionCookie?.value) {
    redirect(`/${locale}`)
  }

  // Buscar o nome do lead para personalização da mensagem
  const lead = await prisma.lead.findFirst({
    where: { session_id: sessionCookie.value },
    select: { name: true },
    orderBy: { created_at: 'desc' },
  })

  return (
    <main data-testid="page-thank-you" className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="max-w-lg w-full">
        <ThankYouMessage
          name={lead?.name ?? null}
          locale={locale}
          homeHref={`/${locale}`}
        />
      </div>
    </main>
  )
}

export async function generateMetadata() {
  return {
    title: 'Obrigado! | Budget Free',
    robots: 'noindex',
  }
}
