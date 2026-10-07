import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export interface PasswordFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  required?: boolean;
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, hint, required, id, className = "", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || `pwd_${label.replace(/\s+/g, "_")}`;
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

        <div className="relative flex items-center">
          <input
            ref={ref}
            id={inputId}
            type={showPassword ? "text" : "password"}
            aria-invalid={Boolean(error)}
            aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
            className={`min-h-[48px] w-full rounded-lg border bg-card px-4 py-2.5 pr-14 text-base text-foreground transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
              error ? "border-error focus:ring-error" : "border-control hover:border-foreground/40"
            } ${className}`}
            {...props}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
            className="absolute right-1 flex min-h-[48px] min-w-[48px] items-center justify-center rounded-md text-secondary transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);

PasswordField.displayName = "PasswordField";
