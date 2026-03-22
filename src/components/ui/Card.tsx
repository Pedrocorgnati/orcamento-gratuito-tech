import { cn } from "@/lib/utils";
import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined" | "elevated";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl p-4 sm:p-6",
          {
            "bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800":
              variant === "default",
            "bg-transparent border-2 border-gray-300 dark:border-gray-600":
              variant === "outlined",
            "bg-white border border-gray-100 shadow-md dark:bg-gray-900 dark:border-gray-800":
              variant === "elevated",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export { Card };
