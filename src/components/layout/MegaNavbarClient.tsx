"use client";

import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { ROUTES } from "@/lib/constants";
import type { SolutionSlug } from "@/lib/solutions/catalog";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { LanguageSelector } from "./LanguageSelector";
import { SolutionIcon } from "./SolutionIcon";

export type MegaNavbarSolutionItem = {
  slug: SolutionSlug;
  name: string;
  shortPitch: string;
  iconKey: string;
};

export type MegaNavbarLabels = {
  logo: string;
  solutions: string;
  solutionsAriaLabel: string;
  howItWorks: string;
  ctaQuote: string;
  allSolutions: string;
  openMenu: string;
  closeMenu: string;
  homeAriaLabel: string;
};

type Props = {
  locale: AppLocale;
  labels: MegaNavbarLabels;
  solutionItems: MegaNavbarSolutionItem[];
};

export function MegaNavbarClient({ locale, labels, solutionItems }: Props) {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const desktopTriggerRef = useRef<HTMLButtonElement>(null);

  const closeDesktop = useCallback(() => setDesktopOpen(false), []);

  useEffect(() => {
    if (!desktopOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        closeDesktop();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDesktop();
        desktopTriggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [desktopOpen, closeDesktop]);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      data-testid="meganavbar"
      className="sticky top-0 z-40 h-14 w-full border-b border-(--color-border)/50 bg-(--color-background)/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          locale={locale}
          data-testid="meganavbar-logo"
          aria-label={labels.homeAriaLabel}
          className="flex items-center gap-2 text-lg font-bold text-(--color-text-primary) hover:text-(--color-primary) transition-colors"
        >
          <Image
            src="/images/logo.svg"
            alt={labels.logo}
            width={140}
            height={32}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label={labels.solutions}
          className="hidden lg:flex lg:items-center lg:gap-1"
        >
          <div ref={dropdownRef} className="relative">
            <button
              ref={desktopTriggerRef}
              type="button"
              data-testid="navbar-solutions-trigger"
              aria-expanded={desktopOpen}
              aria-haspopup="menu"
              aria-controls="navbar-solutions-menu"
              aria-label={labels.solutionsAriaLabel}
              onClick={() => setDesktopOpen((v) => !v)}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-md px-3 text-sm font-medium text-(--color-text-primary) hover:bg-(--color-muted) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) transition-colors"
            >
              {labels.solutions}
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  desktopOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {desktopOpen && (
              <div
                id="navbar-solutions-menu"
                data-testid="navbar-solutions-menu"
                role="menu"
                className="absolute left-0 top-full mt-2 w-[640px] rounded-lg border border-(--color-border) bg-(--color-background) p-2 shadow-lg"
              >
                <ul className="grid grid-cols-2 gap-1">
                  {solutionItems.map((item) => (
                    <li key={item.slug} role="none">
                      <Link
                        role="menuitem"
                        href={{
                          pathname: "/solucoes/[slug]",
                          params: { slug: item.slug },
                        }}
                        locale={locale}
                        data-testid={`navbar-solutions-item-${item.slug}`}
                        onClick={closeDesktop}
                        className="group flex items-start gap-3 rounded-md p-3 hover:bg-(--color-muted) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) transition-colors"
                      >
                        <SolutionIcon
                          iconKey={item.iconKey}
                          className="mt-0.5 h-5 w-5 shrink-0 text-(--color-primary)"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-(--color-text-primary)">
                            {item.name}
                          </div>
                          <div className="truncate text-xs text-(--color-text-secondary)">
                            {item.shortPitch}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 border-t border-(--color-border) pt-2">
                  <Link
                    href="/solucoes"
                    locale={locale}
                    onClick={closeDesktop}
                    data-testid="navbar-solutions-all"
                    className="block rounded-md px-3 py-2 text-sm font-medium text-(--color-primary) hover:bg-(--color-muted) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) transition-colors"
                  >
                    {labels.allSolutions} →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Desktop right actions */}
        <div className="hidden lg:flex lg:items-center lg:gap-3">
          <LanguageSelector />
          <Link
            href={ROUTES.flow}
            locale={locale}
            data-testid="navbar-cta-quote"
            className="inline-flex min-h-[40px] items-center rounded-md bg-(--color-primary) px-4 text-sm font-semibold text-(--color-on-primary) shadow-sm hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-background) transition"
          >
            {labels.ctaQuote}
          </Link>
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSelector compact />
          <button
            type="button"
            data-testid="navbar-mobile-toggle"
            aria-expanded={mobileOpen}
            aria-controls="navbar-mobile-drawer"
            aria-label={mobileOpen ? labels.closeMenu : labels.openMenu}
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-md text-(--color-text-primary) hover:bg-(--color-muted) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) transition-colors"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          id="navbar-mobile-drawer"
          data-testid="navbar-mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label={labels.solutions}
          className="lg:hidden fixed inset-x-0 top-14 bottom-0 z-40 overflow-y-auto border-t border-(--color-border) bg-(--color-background)"
        >
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
            <button
              type="button"
              aria-expanded={mobileSolutionsOpen}
              aria-controls="navbar-mobile-solutions"
              onClick={() => setMobileSolutionsOpen((v) => !v)}
              className="flex w-full min-h-[44px] items-center justify-between rounded-md px-3 text-base font-semibold text-(--color-text-primary) hover:bg-(--color-muted) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)"
            >
              {labels.solutions}
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-200 ${
                  mobileSolutionsOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {mobileSolutionsOpen && (
              <ul
                id="navbar-mobile-solutions"
                className="mt-1 flex flex-col gap-1"
              >
                {solutionItems.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={{
                        pathname: "/solucoes/[slug]",
                        params: { slug: item.slug },
                      }}
                      locale={locale}
                      onClick={() => setMobileOpen(false)}
                      data-testid={`navbar-mobile-item-${item.slug}`}
                      className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-(--color-text-primary) hover:bg-(--color-muted) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)"
                    >
                      <SolutionIcon
                        iconKey={item.iconKey}
                        className="h-5 w-5 shrink-0 text-(--color-primary)"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium">{item.name}</span>
                        <span className="block text-xs text-(--color-text-secondary)">
                          {item.shortPitch}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/solucoes"
                    locale={locale}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-3 text-sm font-semibold text-(--color-primary) hover:bg-(--color-muted) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)"
                  >
                    {labels.allSolutions} →
                  </Link>
                </li>
              </ul>
            )}

            <Link
              href={ROUTES.flow}
              locale={locale}
              onClick={() => setMobileOpen(false)}
              className="mt-4 flex w-full min-h-[48px] items-center justify-center rounded-md bg-(--color-primary) px-4 text-base font-semibold text-(--color-on-primary) shadow-sm hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2"
            >
              {labels.ctaQuote}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
