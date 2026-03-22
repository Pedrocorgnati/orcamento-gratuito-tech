import { PublicLayout } from "@/components/layout";
import { getSession } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/routing";
import { MagicLinkForm } from "./_components/MagicLinkForm";
import type { Metadata } from "next";

type SessionUser = { email?: string | null };
type Session = { user?: SessionUser } | null;

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

export const metadata: Metadata = {
  title: "Acesso ao Painel",
};

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "Acesso não autorizado.",
  auth_callback_failed: "Erro no link de autenticação. Solicite um novo.",
  rate_limit_exceeded: "Muitas tentativas. Aguarde antes de tentar novamente.",
};

export default async function AdminPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const safeLocale = locale as Locale;
  const { error } = await searchParams;
  const session = (await getSession()) as Session;
  const isAuthenticated = !!session;
  const userEmail = session?.user?.email ?? undefined;

  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <PublicLayout
      locale={safeLocale}
      variant="admin"
      isAuthenticated={isAuthenticated}
      userEmail={userEmail}
    >
      <div data-testid="admin-page" className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-8 sm:py-12">
        {/* Error toast from URL param */}
        {errorMessage && (
          <div
            data-testid="admin-error-alert"
            role="alert"
            className="fixed bottom-2 right-2 left-2 sm:bottom-4 sm:right-4 sm:left-auto sm:max-w-xs rounded-md bg-red-600 px-4 py-3 text-sm text-white shadow-lg"
          >
            {errorMessage}
          </div>
        )}

        {isAuthenticated ? (
          /* Dashboard placeholder */
          <div data-testid="admin-dashboard" className="w-full max-w-sm text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Painel Administrativo
            </h1>
            {userEmail && (
              <p data-testid="admin-user-email" className="mt-2 text-gray-600 dark:text-gray-400">
                Bem-vindo, {userEmail}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
              Dashboard em construção — módulos futuros
            </p>
            <form data-testid="admin-logout-form" action="/api/auth/logout" method="POST" className="mt-6">
              <button
                data-testid="admin-logout-button"
                type="submit"
                className="text-sm text-red-600 underline hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              >
                Sair
              </button>
            </form>
          </div>
        ) : (
          <MagicLinkForm />
        )}
      </div>
    </PublicLayout>
  );
}
