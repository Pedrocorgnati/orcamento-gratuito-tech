import { cn } from "@/lib/utils";
import React from "react";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn("block text-sm font-medium text-(--color-text-secondary)", className)}
        {...props}
      >
        {children}
        {required && (
          <span className="ml-1 text-(--color-danger)" aria-label="obrigatório">
            *
          </span>
        )}
      </label>
    );
  }
);

Label.displayName = "Label";

export { Label };
