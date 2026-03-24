import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { PublicLayout } from "@/components/layout"
import { ErrorBoundary } from "@/components/ui/ErrorBoundary"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { AppLocale } from "@/i18n/routing"
import { MagicLinkForm } from "./_components/MagicLinkForm"
import type { Metadata } from "next"

type PageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "admin" })
  return {
    title: t("loginTitle"),
  }
}

export default async function AdminPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  const safeLocale = locale as AppLocale
  const { error } = await searchParams

  const t = await getTranslations({ locale, namespace: "admin" })
  const tErrors = await getTranslations({ locale, namespace: "errors" })

  // Verificar sessao
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isAuthenticated = !!session
  const userEmail = session?.user?.email ?? undefined

  // Se autenticado, validar se e o email admin autorizado
  if (session?.user) {
    const adminEmail = process.env.ADMIN_EMAIL
    if (
      adminEmail &&
      session.user.email?.toLowerCase() !== adminEmail.toLowerCase()
    ) {
      // Sessao valida mas nao e o email admin — fazer logout
      await supabase.auth.signOut()
      redirect(`/${safeLocale}/admin?error=unauthorized`)
    }
  }

  const ERROR_MESSAGES: Record<string, string> = {
    unauthorized: t("unauthorized"),
    auth_callback_failed: tErrors("generic"),
    rate_limit_exceeded: tErrors("rateLimitExceeded", { seconds: "60" }),
    invalid_code: tErrors("sessionExpired"),
    server_error: tErrors("serverError"),
  }

  const errorMessage = error ? ERROR_MESSAGES[error] : undefined

  return (
    <PublicLayout
      locale={safeLocale}
      variant="admin"
      isAuthenticated={isAuthenticated}
      userEmail={userEmail}
    >
      <ErrorBoundary>
        <div
          data-testid="admin-page"
          className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-8 sm:py-12"
        >
          {/* Error toast from URL param */}
          {errorMessage && (
            <div
              data-testid="admin-error-alert"
              role="alert"
              className="fixed bottom-2 right-2 left-2 z-50 rounded-md bg-red-600 px-4 py-3 text-sm text-white shadow-lg sm:bottom-4 sm:right-4 sm:left-auto sm:max-w-xs"
            >
              {errorMessage}
            </div>
          )}

          {isAuthenticated ? (
            /* Dashboard placeholder */
            <div
              data-testid="admin-dashboard"
              className="w-full max-w-sm text-center"
            >
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t("title")}
              </h1>
              {userEmail && (
                <p
                  data-testid="admin-user-email"
                  className="mt-2 text-gray-600 dark:text-gray-400"
                >
                  {userEmail}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                {t("dashboard")}
              </p>
              <form
                data-testid="admin-logout-form"
                action="/api/auth/logout"
                method="POST"
                className="mt-6"
              >
                <button
                  data-testid="admin-logout-button"
                  type="submit"
                  className="text-sm text-red-600 underline hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                >
                  {t("logout")}
                </button>
              </form>
            </div>
          ) : (
            <MagicLinkForm />
          )}
        </div>
      </ErrorBoundary>
    </PublicLayout>
  )
}
