"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  action?: React.ReactNode;
  className?: string;
}

/**
 * MobileHeader — header compacto para sub-páginas mobile (<768px).
 * Especificado em MOBILE-GUIDE.md §3.1
 * Estrutura: [back-btn | logo/title | action-btn]
 * Altura: 56px + env(safe-area-inset-top)
 * Visível apenas em < 768px (md:hidden).
 */
export function MobileHeader({
  title,
  showBack = false,
  onBack,
  action,
  className,
}: MobileHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header
      data-testid="mobile-header"
      className={cn(
        "sticky top-0 z-40 flex items-center justify-between px-4 md:hidden",
        "bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800",
        // 56px + safe-area-inset-top para notch
        "h-14 pt-[env(safe-area-inset-top)]",
        className
      )}
      style={{ minHeight: "calc(56px + env(safe-area-inset-top))" }}
    >
      {/* Back button (48×48px touch target) */}
      {showBack ? (
        <button
          type="button"
          data-testid="mobile-header-back-button"
          onClick={handleBack}
          aria-label="Voltar"
          className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : (
        <div className="min-w-[48px]" aria-hidden="true" />
      )}

      {/* Title */}
      {title && (
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </span>
      )}

      {/* Right action (max 1 ícone) */}
      {action ? (
        <div className="flex min-h-[48px] min-w-[48px] items-center justify-center">
          {action}
        </div>
      ) : (
        <div className="min-w-[48px]" aria-hidden="true" />
      )}
    </header>
  );
}
