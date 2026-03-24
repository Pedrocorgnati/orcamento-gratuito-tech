import { cn } from "@/lib/utils";
import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm: "p-2 sm:p-3",
  md: "p-4 sm:p-6",
  lg: "p-6 sm:p-8",
} as const;

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", padding = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl",
          paddingMap[padding],
          {
            "bg-(--color-background) border border-(--color-border)":
              variant === "default",
            "bg-transparent border-2 border-(--color-border)":
              variant === "outlined",
            "bg-(--color-background) border border-(--color-border) shadow-(--shadow-md)":
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
