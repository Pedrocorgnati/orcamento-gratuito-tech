import { redirect } from 'next/navigation'
import { getSession } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { NextIntlClientProvider } from 'next-intl'
import ptBRMessages from '../../../../../messages/pt-BR.json'

interface AdminDashboardLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AdminDashboardLayout({
  children,
  params,
}: AdminDashboardLayoutProps) {
  const { locale } = await params
  const session = await getSession()

  if (!session) {
    redirect(`/${locale}/admin?reason=unauthorized`)
  }

  // Validar email admin autorizado
  const adminEmail = process.env.ADMIN_EMAIL
  if (
    adminEmail &&
    session.user.email?.toLowerCase() !== adminEmail.toLowerCase()
  ) {
    redirect(`/${locale}/admin?error=unauthorized`)
  }

  return (
    <NextIntlClientProvider locale="pt-BR" messages={ptBRMessages}>
      <div className="min-h-screen bg-(--color-surface) flex flex-col">
        <AdminHeader userEmail={session.user.email ?? undefined} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </NextIntlClientProvider>
  )
}
