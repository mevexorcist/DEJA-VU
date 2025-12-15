import { NextRequest, NextResponse } from 'next/server';
import { supabase } from './supabase';
import DOMPurify from 'isomorphic-dompurify';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string;
}

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting middleware
export function createRateLimit(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const key = config.keyGenerator
      ? config.keyGenerator(req)
      : req.ip || req.headers.get('x-forwarded-for') || 'anonymous';

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean up expired entries
    for (const [k, v] of Array.from(rateLimitStore.entries())) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }

    const current = rateLimitStore.get(key);

    if (!current || current.resetTime < now) {
      // First request in window or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return null; // Allow request
    }

    if (current.count >= config.maxRequests) {
      // Rate limit exceeded
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((current.resetTime - now) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(
              (current.resetTime - now) / 1000
            ).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': current.resetTime.toString(),
          },
        }
      );
    }

    // Increment counter
    current.count++;
    rateLimitStore.set(key, current);

    return null; // Allow request
  };
}

// Common rate limit configurations
export const rateLimits = {
  // General API requests: 100 requests per 15 minutes
  general: createRateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
  }),

  // Authentication: 5 attempts per 15 minutes
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  }),

  // Post creation: 10 posts per hour
  posting: createRateLimit({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      const authHeader = req.headers.get('authorization');
      return authHeader ? `user:${authHeader}` : req.ip || 'anonymous';
    },
  }),

  // Search: 30 requests per minute
  search: createRateLimit({
    windowMs: 60 * 1000,
    maxRequests: 30,
  }),
};

// Input sanitization
export class InputSanitizer {
  // Sanitize HTML content to prevent XSS
  static sanitizeHtml(input: string): string {
    // First remove dangerous patterns manually
    let sanitized = input
      .replace(
        /(javascript:|vbscript:|onload|onerror|onclick|onmouseover|onmouseout|onfocus|onblur)/gi,
        ''
      )
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');

    // Then use DOMPurify for additional sanitization
    return DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
      ALLOWED_ATTR: ['href', 'target'],
      ALLOW_DATA_ATTR: false,
    });
  }

  // Sanitize plain text (remove HTML tags, trim whitespace, remove SQL injection patterns)
  static sanitizeText(input: string): string {
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(
        /(\'|\\\'|;|--|drop\s+table|union\s+select|insert\s+into|delete\s+from|update\s+set|exec|execute|sp_\w+|xp_\w+)/gi,
        ''
      ) // Remove SQL injection patterns
      .trim() // Remove leading/trailing whitespace
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  // Validate and sanitize username
  static sanitizeUsername(username: string): string {
    return username
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '') // Only allow alphanumeric and underscore
      .substring(0, 20); // Max 20 characters
  }

  // Validate and sanitize email
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  // Sanitize search query
  static sanitizeSearchQuery(query: string): string {
    return query
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML
      .replace(
        /(\'|\\\'|;|--|drop\s+table|union\s+select|insert\s+into|delete\s+from|update\s+set|exec|execute|sp_\w+|xp_\w+)/gi,
        ''
      ) // Remove SQL injection patterns
      .replace(
        /(javascript:|vbscript:|onload|onerror|onclick|onmouseover)/gi,
        ''
      ) // Remove XSS patterns
      .substring(0, 100); // Limit length
  }

  // Validate content length and sanitize
  static sanitizePostContent(
    content: string,
    maxLength: number = 2000
  ): string {
    const sanitized = this.sanitizeText(content);

    if (sanitized.length === 0) {
      throw new Error('Content cannot be empty');
    }

    if (sanitized.length > maxLength) {
      throw new Error(
        `Content exceeds maximum length of ${maxLength} characters`
      );
    }

    return sanitized;
  }
}

// Request validation
export class RequestValidator {
  // Validate required fields
  static validateRequired(data: Record<string, any>, fields: string[]): void {
    const missing = fields.filter(
      (field) => !data[field] || data[field].toString().trim() === ''
    );

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  // Validate UUID format
  static validateUUID(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  // Validate pagination parameters
  static validatePagination(
    limit?: string,
    offset?: string
  ): { limit: number; offset: number } {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    if (isNaN(parsedOffset) || parsedOffset < 0) {
      throw new Error('Offset must be non-negative');
    }

    return { limit: parsedLimit, offset: parsedOffset };
  }

  // Validate content type
  static validateContentType(req: NextRequest, expectedType: string): void {
    const contentType = req.headers.get('content-type');

    if (!contentType || !contentType.includes(expectedType)) {
      throw new Error(`Expected content type ${expectedType}`);
    }
  }
}

// JWT token validation
export class TokenValidator {
  // Validate JWT token from request
  static async validateToken(
    req: NextRequest
  ): Promise<{ user: any; error?: string }> {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7);

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return { user: null, error: 'Invalid or expired token' };
      }

      return { user };
    } catch (error) {
      return { user: null, error: 'Token validation failed' };
    }
  }

  // Check if token is expired
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

// Security headers middleware
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent XSS attacks
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // HTTPS enforcement
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
  );

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

// Error handling
export class SecurityError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'SecurityError';
  }

  // Determine if error should be logged
  shouldLog(): boolean {
    return this.statusCode >= 500 || this.statusCode === 429;
  }

  // Determine if error details should be exposed to client
  shouldExposeDetails(): boolean {
    return this.statusCode < 500;
  }

  // Convert error to JSON format
  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        metadata: this.metadata,
      },
    };
  }
}

// Audit logging
export class AuditLogger {
  static async logSecurityEvent(
    event: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const logEntry = {
      event,
      userId,
      metadata,
      timestamp: new Date().toISOString(),
      ip: metadata?.ip,
      userAgent: metadata?.userAgent,
    };

    // In production, send to logging service
    console.log('Security Event:', logEntry);

    // Store critical security events in database
    if (
      ['failed_login', 'rate_limit_exceeded', 'invalid_token'].includes(event)
    ) {
      try {
        await supabase.from('security_logs').insert({
          event_type: event,
          user_id: userId,
          metadata: logEntry,
          created_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to log security event:', error);
      }
    }
  }
}
