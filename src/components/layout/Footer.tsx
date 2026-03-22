import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

interface FooterProps {
  locale: Locale;
  privacyLabel?: string;
  copyrightLabel?: string;
}

export function Footer({
  locale,
  privacyLabel = "Política de Privacidade",
  copyrightLabel = "© 2026 Budget Free Engine.",
}: FooterProps) {
  return (
    <footer data-testid="footer" className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <nav
        data-testid="footer-nav"
        aria-label="Footer navigation"
        className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-xs text-gray-500 dark:text-gray-400 sm:flex-row sm:justify-between sm:px-6 lg:px-8"
      >
        <span data-testid="footer-copyright">{copyrightLabel}</span>
        <Link
          href="/privacy"
          locale={locale}
          data-testid="footer-privacy-link"
          className="hover:text-gray-800 hover:underline dark:hover:text-gray-200"
        >
          {privacyLabel}
        </Link>
      </nav>
    </footer>
  );
}
