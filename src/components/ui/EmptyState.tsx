import { cn } from "@/lib/utils";
import React from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

function EmptyState({ icon, message, description, action, className }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center text-center gap-4 py-12 px-4",
        className
      )}
    >
      {icon && (
        <div className="text-5xl text-gray-400" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="text-base font-medium text-gray-900 dark:text-gray-100">
        {message}
      </p>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {action && (
        <Button variant="outline" size="md" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export { EmptyState };
