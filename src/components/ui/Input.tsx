"use client";

import { cn } from "@/lib/utils";
import React, { useId } from "react";
import { Label } from "./Label";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, required, id: externalId, ...props }, ref) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <Label htmlFor={id} required={required}>
            {label}
          </Label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full h-10 min-h-[44px] px-3 text-base rounded-lg border border-(--color-border) bg-(--color-background) text-(--color-text-primary) placeholder:text-(--color-text-muted) transition-colors duration-150",
            "focus:outline-none focus:border-transparent focus:ring-2 focus:ring-(--color-primary)",
            "disabled:bg-(--color-surface) disabled:text-(--color-text-secondary) disabled:cursor-not-allowed",
            error && "border-(--color-danger) focus:ring-(--color-danger)",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...props}
        />
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-(--color-danger)"
          >
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={hintId} className="text-xs text-(--color-text-muted)">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
