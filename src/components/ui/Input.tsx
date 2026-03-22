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
            "w-full h-10 min-h-[44px] px-3 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 transition-colors duration-150",
            "focus:outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500",
            "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
            "dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500",
            "dark:focus:ring-blue-400",
            "dark:disabled:bg-gray-800",
            error && "border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:ring-red-400",
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
            className="text-xs text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={hintId} className="text-xs text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
