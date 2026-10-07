import React from "react";
import type { CaseStatus, Verdict } from "../../contracts/domain";
import { CASE_STATUS_LABELS, VERDICT_LABELS } from "../../domain/status-labels";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, Clock } from "lucide-react";

export interface StatusCardProps {
  verdict?: Verdict;
  caseStatus: CaseStatus;
  title: string;
  message?: string | undefined;
  children?: React.ReactNode;
  className?: string;
}

export function StatusCard({
  verdict,
  caseStatus,
  title,
  message,
  children,
  className = "",
}: StatusCardProps) {
  const getVerdictBadge = () => {
    if (!verdict) return null;
    switch (verdict) {
      case "CORRECT":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-3 py-1 text-xs font-bold text-success">
            <CheckCircle2 className="h-4 w-4" />
            {VERDICT_LABELS.CORRECT}
          </span>
        );
      case "INCORRECT":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-error-bg px-3 py-1 text-xs font-bold text-error">
            <XCircle className="h-4 w-4" />
            {VERDICT_LABELS.INCORRECT}
          </span>
        );
      case "UNREADABLE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-bg px-3 py-1 text-xs font-bold text-warning">
            <AlertTriangle className="h-4 w-4" />
            {VERDICT_LABELS.UNREADABLE}
          </span>
        );
      case "UNDETERMINED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-bold text-secondary">
            <HelpCircle className="h-4 w-4" />
            {VERDICT_LABELS.UNDETERMINED}
          </span>
        );
    }
  };

  const getStatusBadge = () => {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-control/40 bg-card px-2.5 py-1 text-xs font-semibold text-secondary">
        <Clock className="h-3.5 w-3.5" />
        {CASE_STATUS_LABELS[caseStatus]}
      </span>
    );
  };

  const getBorderColor = () => {
    if (verdict === "CORRECT") return "border-success/30 bg-success-bg/20";
    if (verdict === "INCORRECT") return "border-error/30 bg-error-bg/20";
    if (caseStatus === "WAITING_TEACHER") return "border-warning/30 bg-warning-bg/20";
    return "border-border bg-card";
  };

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm transition-all ${getBorderColor()} ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {getVerdictBadge()}
          {getStatusBadge()}
        </div>
      </div>

      <h3 className="mt-3 text-lg font-bold text-foreground">{title}</h3>

      {message && <p className="mt-1 text-sm leading-relaxed text-secondary">{message}</p>}

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
