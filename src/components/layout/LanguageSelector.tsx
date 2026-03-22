"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_LABELS, LOCALES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/mobile/BottomSheet";

// Hook para detectar breakpoint mobile (< 768px)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const handleSelect = useCallback(
    (newLocale: string) => {
      router.replace(pathname, { locale: newLocale });
      setOpen(false);
    },
    [router, pathname]
  );

  // Fechar dropdown desktop no click outside
  useEffect(() => {
    if (isMobile) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile]);

  // Fechar dropdown desktop com Escape
  useEffect(() => {
    if (isMobile) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isMobile]);

  const current = LOCALE_LABELS[locale] ?? LOCALE_LABELS["pt-BR"];

  const trigger = (
    <button
      type="button"
      data-testid="language-selector-button"
      onClick={() => setOpen((o) => !o)}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-label="Selecionar idioma"
      className={cn(
        "flex items-center gap-1.5 px-2 py-1.5 min-h-[44px] min-w-[44px] rounded-md text-sm font-medium",
        "text-gray-700 hover:bg-gray-100 transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "dark:text-gray-200 dark:hover:bg-gray-800"
      )}
    >
      <Globe className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">{current.label}</span>
      {/* Em mobile: apenas flag + ícone chevron */}
      <span className="sm:hidden" aria-hidden="true">{current.flag}</span>
      <ChevronDown
        className={cn(
          "h-4 w-4 transition-transform duration-150",
          open && !isMobile && "rotate-180"
        )}
        aria-hidden="true"
      />
    </button>
  );

  const optionsList = (
    <ul role="listbox" aria-label="Idiomas disponíveis">
      {LOCALES.map((loc) => {
        const info = LOCALE_LABELS[loc];
        const isSelected = loc === locale;
        return (
          <li key={loc} role="option" aria-selected={isSelected}>
            <button
              type="button"
              data-testid={`language-option-${loc}`}
              onClick={() => handleSelect(loc)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
                isSelected
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              )}
            >
              <span aria-hidden="true" className="text-xl">{info.flag}</span>
              <span>{info.label}</span>
              {isSelected && (
                <Check
                  className="ml-auto h-4 w-4 text-blue-600 dark:text-blue-400"
                  aria-hidden="true"
                />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div ref={containerRef} className="relative">
      {trigger}

      {/* Desktop: dropdown popup (>= 768px) — RESOLVED: BottomSheet em mobile */}
      {!isMobile && open && (
        <div
          data-testid="language-selector-dropdown"
          className={cn(
            "absolute right-0 top-full mt-1 z-50 w-48 rounded-md border shadow-lg py-1",
            "bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700"
          )}
        >
          {optionsList}
        </div>
      )}

      {/* Mobile: BottomSheet (< 768px) */}
      {isMobile && (
        <BottomSheet
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Selecionar idioma"
        >
          {optionsList}
        </BottomSheet>
      )}
    </div>
  );
}
