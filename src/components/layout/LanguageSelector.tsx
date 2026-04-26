"use client";
import { trackLocaleChanged } from "@/lib/analytics/events";

import { usePathname, useRouter } from "@/i18n/navigation";
import { type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { useIsMobile } from "@/hooks";

// ---------------------------------------------------------------------------
// Locale options config
// ---------------------------------------------------------------------------

interface LocaleOption {
  value: AppLocale;
  flag: string;
  label: string;
}

const LOCALE_OPTIONS: LocaleOption[] = [
  { value: "pt-BR", flag: "\u{1F1E7}\u{1F1F7}", label: "Portugu\u00eas" },
  { value: "en-US", flag: "\u{1F1FA}\u{1F1F8}", label: "English" },
  { value: "es-ES", flag: "\u{1F1EA}\u{1F1F8}", label: "Espa\u00f1ol" },
  { value: "it-IT", flag: "\u{1F1EE}\u{1F1F9}", label: "Italiano" },
];

// ---------------------------------------------------------------------------
// Cookie helper
// ---------------------------------------------------------------------------

function setCookieLocale(locale: AppLocale) {
  // Cookie valido por 1 ano, path=/ para o middleware ler em todas as rotas
  // SameSite=Lax: previne CSRF sem bloquear navegacao normal
  const maxAge = 365 * 24 * 60 * 60;
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

// ---------------------------------------------------------------------------
// LanguageSelector component
// ---------------------------------------------------------------------------

interface LanguageSelectorProps {
  className?: string;
  compact?: boolean;
}

export function LanguageSelector({
  className,
  compact = false,
}: LanguageSelectorProps) {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const isMobile = useIsMobile();

  const currentOption =
    LOCALE_OPTIONS.find((o) => o.value === locale) ?? LOCALE_OPTIONS[0];

  const openDropdown = useCallback(() => {
    setOpen(true);
    setFocusedIndex(LOCALE_OPTIONS.findIndex((o) => o.value === locale));
  }, [locale]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setFocusedIndex(-1);
  }, []);

  const handleLocaleChange = useCallback(
    (newLocale: AppLocale) => {
      if (newLocale === locale) {
        closeDropdown();
        return;
      }
      trackLocaleChanged({ from: locale, to: newLocale });
      setCookieLocale(newLocale);
      // pathname retornado inclui rotas dinâmicas na união de tipos.
      // No runtime é uma string concreta; o router resolve preservando params.
      router.replace(pathname as never, { locale: newLocale });
      closeDropdown();
    },
    [locale, router, pathname, closeDropdown],
  );

  // Keyboard navigation (WCAG 2.1 Pattern: Listbox)
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!open) {
        if (
          event.key === "Enter" ||
          event.key === " " ||
          event.key === "ArrowDown"
        ) {
          event.preventDefault();
          openDropdown();
        }
        return;
      }

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % LOCALE_OPTIONS.length);
          break;
        case "ArrowUp":
          event.preventDefault();
          setFocusedIndex((prev) =>
            prev <= 0 ? LOCALE_OPTIONS.length - 1 : prev - 1,
          );
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          if (focusedIndex >= 0) {
            handleLocaleChange(LOCALE_OPTIONS[focusedIndex].value);
          }
          break;
        case "Escape":
          event.preventDefault();
          closeDropdown();
          // Devolve foco ao trigger button
          containerRef.current?.querySelector("button")?.focus();
          break;
        case "Tab":
          closeDropdown();
          break;
      }
    },
    [open, focusedIndex, handleLocaleChange, openDropdown, closeDropdown],
  );

  // Click outside to close (desktop only)
  useEffect(() => {
    if (isMobile || !open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeDropdown();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, open, closeDropdown]);

  // Focus on active item when dropdown opens
  useEffect(() => {
    if (open && focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      (items[focusedIndex] as HTMLElement)?.focus();
    }
  }, [open, focusedIndex]);

  const trigger = (
    <button
      type="button"
      data-testid="language-selector-button"
      onClick={() => (open ? closeDropdown() : openDropdown())}
      onKeyDown={handleKeyDown}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-label={t("languageSelector")}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1.5 min-h-[44px] min-w-[44px] rounded-md text-sm font-medium",
        "text-(--color-text-secondary) hover:bg-(--color-muted) transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)",
      )}
    >
      <Globe className="h-4 w-4" aria-hidden="true" />
      {!compact && (
        <span className="hidden sm:inline">{currentOption.label}</span>
      )}
      {/* Em mobile: apenas flag + icone chevron */}
      <span className="sm:hidden" aria-hidden="true">
        {currentOption.flag}
      </span>
      <ChevronDown
        className={cn(
          "h-4 w-4 transition-transform duration-150",
          open && !isMobile && "rotate-180",
        )}
        aria-hidden="true"
      />
    </button>
  );

  const optionsList = (
    <ul
      ref={listRef}
      role="listbox"
      aria-label={t("languageSelector")}
      onKeyDown={handleKeyDown}
    >
      {LOCALE_OPTIONS.map((option, index) => {
        const isSelected = option.value === locale;
        const isFocused = focusedIndex === index;
        return (
          <li
            key={option.value}
            role="option"
            aria-selected={isSelected}
            tabIndex={isFocused ? 0 : -1}
          >
            <button
              type="button"
              data-testid={`language-option-${option.value}`}
              onClick={() => handleLocaleChange(option.value)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--color-primary)",
                isSelected
                  ? "bg-(--color-primary)/10 text-(--color-primary)"
                  : "text-(--color-text-secondary) hover:bg-(--color-muted)",
                isFocused && !isSelected && "ring-2 ring-inset ring-(--color-primary)",
                "first:rounded-t-md last:rounded-b-md",
              )}
            >
              <span aria-hidden="true" className="text-xl">
                {option.flag}
              </span>
              <span>{option.label}</span>
              {isSelected && (
                <Check
                  className="ml-auto h-4 w-4 text-(--color-primary)"
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
    <div ref={containerRef} className={cn("relative", className)}>
      {trigger}

      {/* Desktop: dropdown popup (>= 768px) */}
      {!isMobile && open && (
        <div
          data-testid="language-selector-dropdown"
          className={cn(
            "absolute right-0 top-full mt-1 z-50 w-48 rounded-md border shadow-lg py-1",
            "bg-(--color-background) border-(--color-border)",
          )}
        >
          {optionsList}
        </div>
      )}

      {/* Mobile: BottomSheet (< 768px) */}
      {isMobile && (
        <BottomSheet
          isOpen={open}
          onClose={closeDropdown}
          title={t("languageSelector")}
        >
          {optionsList}
        </BottomSheet>
      )}
    </div>
  );
}
