export type AppErrorKind = 'NOT_FOUND' | 'VALIDATION' | 'PERMISSION' | 'STORAGE' | 'NETWORK' | 'UNKNOWN';

/** Single error shape produced by the data layer and rendered by the UI. */
export class AppError extends Error {
  constructor(
    readonly kind: AppErrorKind,
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static notFound(entity: string, id: string): AppError {
    return new AppError('NOT_FOUND', `${entity} "${id}" was not found.`);
  }

  static validation(message: string): AppError {
    return new AppError('VALIDATION', message);
  }

  static permission(message = 'You do not have permission to perform this action.'): AppError {
    return new AppError('PERMISSION', message);
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  const message = error instanceof Error ? error.message : 'Unexpected error.';
  return new AppError('UNKNOWN', message, error);
}
