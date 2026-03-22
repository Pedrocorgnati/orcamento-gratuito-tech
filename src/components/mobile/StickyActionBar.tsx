import { cn } from "@/lib/utils";
import React from "react";

interface StickyActionBarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * StickyActionBar — barra de ação fixa no rodapé mobile.
 * Especificado em MOBILE-GUIDE.md §3.3
 * Visível em < 768px (md:hidden). Ações ficam inline no desktop.
 * Inclui padding para safe-area-inset-bottom (suporte a notch/home indicator).
 */
export function StickyActionBar({ children, className }: StickyActionBarProps) {
  return (
    <div
      data-testid="sticky-action-bar"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-white dark:bg-gray-950",
        "border-t border-gray-200 dark:border-gray-800",
        "px-4 py-3",
        // Safe area para home indicator do iPhone
        "pb-[calc(12px+env(safe-area-inset-bottom))]",
        className
      )}
    >
      {children}
    </div>
  );
}
