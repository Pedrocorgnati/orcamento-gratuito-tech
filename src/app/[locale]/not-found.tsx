import { PublicLayout } from "@/components/layout";
import { Button } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getLocale, getTranslations } from "next-intl/server";

export default async function NotFound() {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations({ locale, namespace: "errors" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  return (
    <PublicLayout
      locale={locale}
      skipLinkLabel={tCommon("skipToContent")}
      loginLabel={tCommon("admin.login")}
      logoutLabel={tCommon("admin.logout")}
      privacyLabel={tCommon("privacyPolicy")}
      copyrightLabel={tCommon("copyright")}
      homeAriaLabel={tCommon("homeAriaLabel")}
      footerNavLabel={tCommon("footerNav")}
    >
      <div
        role="main"
        aria-labelledby="not-found-title"
        className="relative flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
      >
        {/* Background number */}
        <span
          className="absolute select-none text-8xl font-black text-(--color-border) sm:text-9xl"
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
            className="text-2xl font-bold text-(--color-text-primary) sm:text-3xl"
          >
            {t("notFound")}
          </h1>

          <p className="max-w-md text-base text-(--color-text-secondary)">
            {t("notFoundMessage")}
          </p>

          <Link href="/" locale={locale}>
            <Button variant="primary" size="lg">
              {t("goHome")}
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
