"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type FAQItem = { q: string; a: string };

export function SolutionFAQClient({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <ul className="flex flex-col gap-2" data-testid="solution-faq-list">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <li
            key={i}
            data-testid="solution-faq-item"
            className="rounded-lg border border-(--color-border) bg-(--color-card)"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${i}`}
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full min-h-[48px] items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-(--color-text-primary) hover:bg-(--color-muted)/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)"
            >
              <span>{item.q}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {isOpen && (
              <div
                id={`faq-answer-${i}`}
                role="region"
                className="border-t border-(--color-border) px-4 py-3 text-sm leading-relaxed text-(--color-text-secondary)"
              >
                {item.a}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
