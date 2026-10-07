import React from "react";

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  required?: boolean;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, required, id, className = "", ...props }, ref) => {
    const inputId = id || `field_${label.replace(/\s+/g, "_")}`;
    const errorId = error ? `${inputId}_error` : undefined;
    const hintId = hint ? `${inputId}_hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5 text-left">
        <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
          {label}
          {required && (
            <span className="ml-1 text-error" aria-hidden="true">
              *
            </span>
          )}
        </label>

        {hint && (
          <p id={hintId} className="text-xs text-secondary">
            {hint}
          </p>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
          className={`min-h-[48px] w-full rounded-lg border bg-card px-4 py-2.5 text-base text-foreground transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
            error ? "border-error focus:ring-error" : "border-control hover:border-foreground/40"
          } ${className}`}
          {...props}
        />

        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);

FormField.displayName = "FormField";
