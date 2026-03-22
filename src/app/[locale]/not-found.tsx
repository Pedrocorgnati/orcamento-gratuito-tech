import { PublicLayout } from "@/components/layout";
import { Button } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getLocale, getTranslations } from "next-intl/server";

export default async function NotFound() {
  const locale = await getLocale() as Locale;

  return (
    <PublicLayout locale={locale}>
      <div
        role="main"
        aria-labelledby="not-found-title"
        className="relative flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
      >
        {/* Background number */}
        <span
          className="absolute select-none text-8xl font-black text-gray-100 sm:text-9xl dark:text-gray-800"
          aria-hidden="true"
        >
          404
        </span>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <span className="text-5xl" aria-hidden="true">
            🔍
          </span>

          <h1
            id="not-found-title"
            className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white"
          >
            Página não encontrada
          </h1>

          <p className="max-w-md text-base text-gray-600 dark:text-gray-400">
            A página que você procura não existe ou foi movida.
          </p>

          <Link href="/" locale={locale as any}>
            <Button variant="primary" size="lg">
              Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
