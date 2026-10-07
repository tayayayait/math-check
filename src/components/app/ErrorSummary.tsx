import React from "react";
import { AlertCircle } from "lucide-react";

export interface ErrorSummaryProps {
  errors: string[];
  title?: string;
}

export function ErrorSummary({ errors, title = "입력 내용을 확인해 주세요" }: ErrorSummaryProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <div
      role="alert"
      aria-labelledby="error-summary-title"
      className="mb-4 rounded-lg border border-error/20 bg-error-bg p-4 text-left"
    >
      <div className="flex items-center gap-2 text-error">
        <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
        <h2 id="error-summary-title" className="text-sm font-bold">
          {title}
        </h2>
      </div>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-error">
        {errors.map((msg, idx) => (
          <li key={idx}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}
