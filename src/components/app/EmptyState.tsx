import React from "react";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionText, onAction, icon }: EmptyStateProps) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-control/60 bg-card p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-secondary">
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="mt-4 text-base font-bold text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm text-secondary">{description}</p>}
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
