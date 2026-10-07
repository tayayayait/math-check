import React from "react";

export interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string | undefined;
  unit?: string | undefined;
  helpText?: string | undefined;
  trend?: "up" | "down" | "neutral" | undefined;
  className?: string;
}

export function MetricCard({
  label,
  value,
  subValue,
  unit,
  helpText,
  className = "",
}: MetricCardProps) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 shadow-sm text-left ${className}`}>
      <span className="text-xs font-semibold text-secondary">{label}</span>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums text-foreground">{value}</span>
        {unit && <span className="text-sm font-medium text-secondary">{unit}</span>}
        {subValue && (
          <span className="text-xs font-medium tabular-nums text-secondary">({subValue})</span>
        )}
      </div>
      {helpText && <p className="mt-1 text-xs text-secondary/80">{helpText}</p>}
    </div>
  );
}
