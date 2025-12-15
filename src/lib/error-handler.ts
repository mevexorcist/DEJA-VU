import { NextRequest, NextResponse } from 'next/server';
import { supabase } from './supabase';

// Error types
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
  SECURITY = 'SECURITY_ERROR',
}

// Custom error class
export class AppError extends Error {
  constructor(
    message: string,
    public type: ErrorType,
    public statusCode: number = 500,
    public code?: string,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  // Convert to JSON for API responses
  toJSON() {
    return {
      error: {
        type: this.type,
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        metadata: this.metadata,
      },
    };
  }

  // Check if error should be logged
  shouldLog(): boolean {
    // Don't log validation errors and 4xx client errors (except 429)
    return this.statusCode >= 500 || this.statusCode === 429;
  }

  // Check if error details should be exposed to client
  shouldExposeDetails(): boolean {
    // Only expose details for client errors (4xx)
    return this.statusCode >= 400 && this.statusCode < 500;
  }
}

// Predefined error factories
export const Errors = {
  // Validation errors
  validation: (message: string, field?: string) =>
    new AppError(message, ErrorType.VALIDATION, 400, 'VALIDATION_FAILED', {
      field,
    }),

  required: (field: string) =>
    new AppError(
      `${field} is required`,
      ErrorType.VALIDATION,
      400,
      'FIELD_REQUIRED',
      { field }
    ),

  invalid: (field: string, reason?: string) =>
    new AppError(
      `Invalid ${field}${reason ? `: ${reason}` : ''}`,
      ErrorType.VALIDATION,
      400,
      'INVALID_FIELD',
      { field, reason }
    ),

  // Authentication errors
  unauthorized: (message: string = 'Authentication required') =>
    new AppError(message, ErrorType.AUTHENTICATION, 401, 'UNAUTHORIZED'),

  invalidToken: () =>
    new AppError(
      'Invalid or expired token',
      ErrorType.AUTHENTICATION,
      401,
      'INVALID_TOKEN'
    ),

  // Authorization errors
  forbidden: (message: string = 'Access denied') =>
    new AppError(message, ErrorType.AUTHORIZATION, 403, 'FORBIDDEN'),

  // Not found errors
  notFound: (resource: string = 'Resource') =>
    new AppError(
      `${resource} not found`,
      ErrorType.NOT_FOUND,
      404,
      'NOT_FOUND',
      { resource }
    ),

  // Rate limiting
  rateLimit: (retryAfter?: number) =>
    new AppError(
      'Rate limit exceeded',
      ErrorType.RATE_LIMIT,
      429,
      'RATE_LIMIT_EXCEEDED',
      { retryAfter }
    ),

  // Database errors
  database: (message: string, originalError?: any) =>
    new AppError(message, ErrorType.DATABASE, 500, 'DATABASE_ERROR', {
      originalError,
    }),

  // External API errors
  externalApi: (service: string, message: string) =>
    new AppError(
      `External service error: ${message}`,
      ErrorType.EXTERNAL_API,
      502,
      'EXTERNAL_API_ERROR',
      { service }
    ),

  // Security errors
  security: (message: string, severity: 'low' | 'medium' | 'high' = 'medium') =>
    new AppError(message, ErrorType.SECURITY, 400, 'SECURITY_VIOLATION', {
      severity,
    }),

  // Internal errors
  internal: (message: string = 'Internal server error', originalError?: any) =>
    new AppError(message, ErrorType.INTERNAL, 500, 'INTERNAL_ERROR', {
      originalError,
    }),
};

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// Logger interface
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
    type?: ErrorType;
    code?: string;
  };
}

// Logger implementation
export class Logger {
  private static requestId = 0;

  // Generate unique request ID
  static generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestId}`;
  }

  // Create logger with request context
  static withContext(req?: NextRequest, requestId?: string) {
    const context = {
      requestId: requestId || this.generateRequestId(),
      ip: req?.ip || req?.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req?.headers.get('user-agent') || 'unknown',
      url: req?.url,
      method: req?.method,
    };

    return {
      debug: (message: string, metadata?: Record<string, any>) =>
        this.log(LogLevel.DEBUG, message, { ...context, ...metadata }),

      info: (message: string, metadata?: Record<string, any>) =>
        this.log(LogLevel.INFO, message, { ...context, ...metadata }),

      warn: (message: string, metadata?: Record<string, any>) =>
        this.log(LogLevel.WARN, message, { ...context, ...metadata }),

      error: (
        message: string,
        error?: Error | AppError,
        metadata?: Record<string, any>
      ) =>
        this.log(LogLevel.ERROR, message, { ...context, ...metadata }, error),

      fatal: (
        message: string,
        error?: Error | AppError,
        metadata?: Record<string, any>
      ) =>
        this.log(LogLevel.FATAL, message, { ...context, ...metadata }, error),
    };
  }

  // Core logging method
  private static async log(
    level: LogLevel,
    message: string,
    metadata: Record<string, any> = {},
    error?: Error | AppError
  ): Promise<void> {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
      ...metadata, // Spread context data
    };

    // Add error details if provided
    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        type: error instanceof AppError ? error.type : undefined,
        code: error instanceof AppError ? error.code : undefined,
      };
    }

    // Console logging (always)
    this.logToConsole(logEntry);

    // Database logging for important events
    if (this.shouldLogToDatabase(level, error)) {
      await this.logToDatabase(logEntry);
    }

    // External logging service (in production)
    if (process.env.NODE_ENV === 'production') {
      await this.logToExternalService(logEntry);
    }
  }

  // Console logging with colors
  private static logToConsole(entry: LogEntry): void {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m', // Green
      [LogLevel.WARN]: '\x1b[33m', // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m', // Magenta
    };

    const reset = '\x1b[0m';
    const color = colors[entry.level] || '';

    const prefix = `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp}`;
    const message = `${prefix} ${entry.message}`;

    console.log(message);

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      console.log('  Metadata:', JSON.stringify(entry.metadata, null, 2));
    }

    if (entry.error) {
      console.log('  Error:', entry.error);
      if (entry.error.stack) {
        console.log('  Stack:', entry.error.stack);
      }
    }
  }

  // Database logging for persistent storage
  private static async logToDatabase(entry: LogEntry): Promise<void> {
    try {
      await supabase.from('application_logs').insert({
        level: entry.level,
        message: entry.message,
        metadata: entry.metadata,
        user_id: entry.userId,
        request_id: entry.requestId,
        ip_address: entry.ip,
        user_agent: entry.userAgent,
        url: entry.url,
        method: entry.method,
        error_details: entry.error,
        created_at: entry.timestamp,
      });
    } catch (error) {
      console.error('Failed to log to database:', error);
    }
  }

  // External logging service integration
  private static async logToExternalService(entry: LogEntry): Promise<void> {
    // Implement integration with external logging services like:
    // - Sentry for error tracking
    // - DataDog for monitoring
    // - LogRocket for session replay
    // - etc.

    // Example: Send to webhook or external API
    if (process.env.LOG_WEBHOOK_URL) {
      try {
        await fetch(process.env.LOG_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
      } catch (error) {
        console.error('Failed to send log to external service:', error);
      }
    }
  }

  // Determine if log should be persisted to database
  private static shouldLogToDatabase(
    level: LogLevel,
    error?: Error | AppError
  ): boolean {
    // Log errors and warnings to database
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      return true;
    }

    // Log security events
    if (error instanceof AppError && error.type === ErrorType.SECURITY) {
      return true;
    }

    // Log rate limit events
    if (error instanceof AppError && error.type === ErrorType.RATE_LIMIT) {
      return true;
    }

    return false;
  }
}

// Global error handler for API routes
export function createErrorHandler() {
  return async (
    error: Error | AppError,
    req: NextRequest,
    requestId: string
  ): Promise<NextResponse> => {
    const logger = Logger.withContext(req, requestId);

    // Handle known application errors
    if (error instanceof AppError) {
      if (error.shouldLog()) {
        logger.error(`Application error: ${error.message}`, error, {
          type: error.type,
          code: error.code,
          statusCode: error.statusCode,
        });
      }

      return NextResponse.json(
        {
          error: {
            message: error.shouldExposeDetails()
              ? error.message
              : 'An error occurred',
            code: error.code,
            type: error.type,
            ...(error.shouldExposeDetails() && error.metadata
              ? { details: error.metadata }
              : {}),
          },
          requestId,
        },
        { status: error.statusCode }
      );
    }

    // Handle unknown errors
    logger.fatal('Unhandled error', error);

    return NextResponse.json(
      {
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          type: ErrorType.INTERNAL,
        },
        requestId,
      },
      { status: 500 }
    );
  };
}

// Async error wrapper for API routes
export function asyncHandler(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const requestId = Logger.generateRequestId();
    const logger = Logger.withContext(req, requestId);
    const errorHandler = createErrorHandler();

    try {
      logger.info(`${req.method} ${req.url}`);
      const response = await handler(req, context);
      logger.info(`Response: ${response.status}`);
      return response;
    } catch (error) {
      return errorHandler(error as Error, req, requestId);
    }
  };
}

// Performance monitoring wrapper
export function withPerformanceMonitoring<T extends any[], R>(
  name: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const start = Date.now();
    const logger = Logger.withContext();

    try {
      const result = await fn(...args);
      const duration = Date.now() - start;

      logger.info(`Performance: ${name} completed`, { duration });

      // Log slow operations
      if (duration > 5000) {
        // 5 seconds
        logger.warn(`Slow operation detected: ${name}`, { duration });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`Performance: ${name} failed`, error as Error, { duration });
      throw error;
    }
  };
}
