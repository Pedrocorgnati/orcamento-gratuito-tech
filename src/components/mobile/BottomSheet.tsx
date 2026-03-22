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
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);

  // Fechar com Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
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
