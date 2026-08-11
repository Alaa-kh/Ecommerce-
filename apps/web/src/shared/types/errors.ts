export class AppError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(params: {
    message: string;
    code: string;
    status?: number;
    details?: unknown;
    requestId?: string;
  }) {
    super(params.message);
    this.name = 'AppError';
    this.code = params.code;
    this.status = params.status;
    this.details = params.details;
    this.requestId = params.requestId;
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError({
      message: error.message,
      code: 'UNKNOWN_ERROR',
    });
  }

  return new AppError({
    message: 'Unexpected error',
    code: 'UNKNOWN_ERROR',
  });
}
