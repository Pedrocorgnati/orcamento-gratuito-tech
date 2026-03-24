import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-(--color-primary) text-(--color-on-primary) hover:bg-(--color-primary-hover) focus-visible:ring-(--color-primary) active:brightness-95",
        secondary:
          "bg-(--color-muted) text-(--color-text-primary) hover:bg-(--color-surface) focus-visible:ring-(--color-border)",
        outline:
          "border-2 border-(--color-primary) text-(--color-primary) bg-transparent hover:bg-(--color-accent) focus-visible:ring-(--color-primary)",
        ghost:
          "bg-transparent text-(--color-text-secondary) hover:bg-(--color-surface) focus-visible:ring-(--color-border)",
        destructive:
          "bg-(--color-danger) text-(--color-on-danger) hover:opacity-90 focus-visible:ring-(--color-danger)",
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-md",
        md: "h-10 px-4 text-sm rounded-lg min-w-[44px]",
        lg: "h-12 px-6 text-base rounded-lg min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
