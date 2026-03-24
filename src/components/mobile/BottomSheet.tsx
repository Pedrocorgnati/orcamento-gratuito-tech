"use client";

import { useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * BottomSheet — modal deslizante de baixo para cima.
 * Especificado em MOBILE-GUIDE.md §3.4
 * Snap points: ~50% e ~90% da viewport.
 * Drag handle no topo, overlay com backdrop-blur.
 * Fecha com Escape, clique no overlay ou swipe-down.
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0); // RESOLVED: removido _currentYRef nunca utilizado (G015)

  // Focar o sheet ao abrir e restaurar o foco ao fechar (WCAG 2.4.3)
  const triggerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      // Pequeno delay para garantir que o sheet está no DOM
      requestAnimationFrame(() => sheetRef.current?.focus());
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  // Fechar com Escape + focus trap com Tab (WCAG 2.1.2)
  useEffect(() => {
    if (!isOpen) return;

    const FOCUSABLE =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const sheet = sheetRef.current;
      if (!sheet) return;

      const focusable = Array.from(
        sheet.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => !el.hasAttribute("disabled"));

      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Travar scroll do body quando aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Swipe-down para fechar (threshold 80px)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const delta = e.changedTouches[0].clientY - startYRef.current;
      if (delta > 80) onClose();
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-white dark:bg-gray-950",
          "rounded-t-2xl",
          "max-h-[90dvh] overflow-y-auto",
          "pb-[env(safe-area-inset-bottom)]",
          "focus:outline-none",
          className
        )}
        tabIndex={-1}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="h-1 w-8 rounded-full bg-gray-300 dark:bg-gray-600"
            aria-hidden="true"
          />
        </div>

        {/* Header */}
        {title && (
          <div className="px-4 pb-3 pt-1">
            <h2 className="text-center text-sm font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div className="px-4 pb-4">{children}</div>
      </div>
    </>
  );
}
