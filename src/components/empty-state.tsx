import React from "react";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  compact?: boolean;
}

export function EmptyState({ icon = "📭", title, description, action, compact = false }: EmptyStateProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-8" : "py-16"}`}>
      {icon && <div className={`mb-4 ${compact ? "text-3xl" : "text-5xl"}`}>{icon}</div>}
      <h3 className={`font-semibold text-slate-900 ${compact ? "text-sm" : "text-base"}`}>{title}</h3>
      {description && (
        <p className={`mt-1 text-slate-500 ${compact ? "text-xs" : "text-sm"} max-w-xs`}>{description}</p>
      )}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <a href={action.href} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
              {action.label} →
            </a>
          ) : (
            <button
              onClick={action.onClick}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              {action.label} →
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (compact) {
    return <div className="rounded-md bg-slate-50 border border-slate-200">{content}</div>;
  }

  return (
    <Card className="flex items-center justify-center">
      {content}
    </Card>
  );
}
