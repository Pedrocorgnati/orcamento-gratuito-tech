import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { ROUTES } from "@/lib/constants";

interface FooterProps {
  locale: AppLocale;
  privacyLabel?: string;
  copyrightLabel?: string;
  footerNavLabel?: string;
}

export function Footer({
  locale,
  privacyLabel = "Política de Privacidade",
  copyrightLabel = "© 2026 Budget Free Engine.",
  footerNavLabel = "Footer navigation",
}: FooterProps) {
  return (
    <footer data-testid="footer" className="border-t border-(--color-border) bg-(--color-background)">
      <nav
        data-testid="footer-nav"
        aria-label={footerNavLabel}
        className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-xs text-(--color-text-muted) sm:flex-row sm:justify-between sm:px-6 lg:px-8"
      >
        <span data-testid="footer-copyright">{copyrightLabel}</span>
        <Link
          href={ROUTES.privacy}
          locale={locale}
          data-testid="footer-privacy-link"
          className="hover:text-(--color-text-primary) hover:underline"
        >
          {privacyLabel}
        </Link>
      </nav>
    </footer>
  );
}
