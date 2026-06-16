import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'

interface AdminDashboardLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AdminDashboardLayout({
  children,
  params,
}: AdminDashboardLayoutProps) {
  const { locale } = await params
  setRequestLocale(locale)

  // P2-5: getUser() revalida o token no servidor de auth do Supabase.
  // getSession() apenas lê/decodifica o cookie e é desencorajado para
  // autorização server-side. Mantém defesa em profundidade (middleware + rotas).
  const user = await getUser()

  if (!user) {
    redirect(`/${locale}/admin?reason=unauthorized`)
  }

  // Validar email admin autorizado
  const adminEmail = process.env.ADMIN_EMAIL
  if (
    adminEmail &&
    user.email?.toLowerCase() !== adminEmail.toLowerCase()
  ) {
    redirect(`/${locale}/admin?error=unauthorized`)
  }

  // O-2: mensagens i18n pelo locale da rota (antes hardcode pt-BR).
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div data-testid="admin-dashboard-layout" className="min-h-screen bg-(--color-surface) flex flex-col">
        <AdminHeader userEmail={user.email ?? undefined} />
        <main data-testid="admin-dashboard-main" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </NextIntlClientProvider>
  )
}
