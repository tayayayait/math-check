/**
 * 공통 오류 규격 및 에러 모델
 * contracts/errors.ts
 */

export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "VERSION_CONFLICT"
  | "IDEMPOTENCY_CONFLICT"
  | "STATE_CONFLICT"
  | "QUOTA_EXCEEDED"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";

export interface AppErrorDetail {
  code: AppErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
  retryAfter?: number; // seconds
  details?: unknown;
}

export interface AppErrorResponse {
  error: AppErrorDetail;
  requestId: string;
}

export interface AppSuccessResponse<T> {
  data: T;
  requestId: string;
}

export type Result<T> = AppSuccessResponse<T> | AppErrorResponse;

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly fieldErrors?: Record<string, string> | undefined;
  public readonly retryAfter?: number | undefined;
  public readonly requestId: string;

  constructor(detail: AppErrorDetail, requestId?: string) {
    super(detail.message);
    this.name = "AppError";
    this.code = detail.code;
    this.fieldErrors = detail.fieldErrors;
    this.retryAfter = detail.retryAfter;
    this.requestId = requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  toResponse(): AppErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.fieldErrors ? { fieldErrors: this.fieldErrors } : {}),
        ...(this.retryAfter !== undefined ? { retryAfter: this.retryAfter } : {}),
      },
      requestId: this.requestId,
    };
  }
}

export function isAppErrorResponse(response: unknown): response is AppErrorResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "error" in response &&
    typeof (response as AppErrorResponse).error === "object" &&
    typeof (response as AppErrorResponse).requestId === "string"
  );
}

export function isSuccessResponse<T>(response: Result<T>): response is AppSuccessResponse<T> {
  return !isAppErrorResponse(response) && "data" in response;
}

export function createErrorResponse(
  code: AppErrorCode,
  message: string,
  options?: {
    fieldErrors?: Record<string, string>;
    retryAfter?: number;
    requestId?: string;
  },
): AppErrorResponse {
  return {
    error: {
      code,
      message,
      ...(options?.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
      ...(options?.retryAfter !== undefined ? { retryAfter: options.retryAfter } : {}),
    },
    requestId:
      options?.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  };
}

export function createSuccessResponse<T>(data: T, requestId?: string): AppSuccessResponse<T> {
  return {
    data,
    requestId: requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  };
}
