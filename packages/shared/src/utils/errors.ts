export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

export class AppError extends Error {
  public readonly status: number;
  public readonly type: string;
  public readonly details?: Record<string, string[]>;

  constructor(message: string, status = 500, type = 'https://caseprac.dev/errors/internal', details?: Record<string, string[]>) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.type = type;
    this.details = details;
  }

  toProblemDetails(instance?: string): ProblemDetails {
    return {
      type: this.type,
      title: this.name,
      status: this.status,
      detail: this.message,
      ...(instance ? { instance } : {}),
      ...(this.details ? { errors: this.details } : {}),
    };
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, idOrSlug?: string) {
    super(
      `${entity}${idOrSlug ? ` '${idOrSlug}'` : ''} not found`,
      404,
      'https://caseprac.dev/errors/not-found'
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, string[]>) {
    super(
      message,
      400,
      'https://caseprac.dev/errors/validation-error',
      details
    );
  }
}

export class SsrfBlockError extends AppError {
  constructor(targetUrl: string, reason: string) {
    super(
      `URL '${targetUrl}' rejected for security reasons: ${reason}`,
      400,
      'https://caseprac.dev/errors/ssrf-blocked'
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'https://caseprac.dev/errors/unauthorized');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'https://caseprac.dev/errors/forbidden');
  }
}
