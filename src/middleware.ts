import { NextRequest, NextResponse } from 'next/server';
import {
  rateLimits,
  addSecurityHeaders,
  TokenValidator,
  AuditLogger,
} from '@/lib/security';
import { Logger } from '@/lib/error-handler';
import { APMMonitor } from '@/lib/monitoring';

// Initialize monitoring (only once)
let monitoringInitialized = false;
if (!monitoringInitialized) {
  try {
    APMMonitor.initialize();
    monitoringInitialized = true;
  } catch (error) {
    console.error('Failed to initialize monitoring in middleware:', error);
  }
}

// Middleware configuration
export const config = {
  matcher: [
    // API routes
    '/api/:path*',
    // Exclude static files and internal Next.js routes
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

// Route-specific rate limiting configuration
const routeRateLimits: Record<
  string,
  (req: NextRequest) => Promise<NextResponse | null>
> = {
  '/api/auth': rateLimits.auth,
  '/api/posts': rateLimits.posting,
  '/api/search': rateLimits.search,
};

export async function middleware(request: NextRequest) {
  const logger = Logger.withContext(request);
  const startTime = Date.now();
  const endTimer = APMMonitor.timer('middleware_duration');

  try {
    // Generate request ID for tracing
    const requestId = Logger.generateRequestId();

    // Record request metrics
    APMMonitor.counter('requests_total', 1, {
      method: request.method,
      path: request.nextUrl.pathname,
    });

    // Log incoming request
    logger.info('Incoming request', {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      requestId,
    });

    // Apply security headers to all responses
    const response = NextResponse.next();
    addSecurityHeaders(response);

    // Skip middleware for static files and health checks
    if (
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/health') ||
      request.nextUrl.pathname.includes('.')
    ) {
      return response;
    }

    // API route security
    if (request.nextUrl.pathname.startsWith('/api')) {
      return await handleApiSecurity(request, requestId, logger);
    }

    // Page route security
    return await handlePageSecurity(request, response, requestId, logger);
  } catch (error) {
    logger.error('Middleware error', error as Error);
    APMMonitor.counter('middleware_errors', 1, {
      error_type: (error as Error).name,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    endTimer();
    const duration = Date.now() - startTime;
    APMMonitor.histogram(
      'middleware_response_time',
      duration,
      {
        method: request.method,
        path: request.nextUrl.pathname,
      },
      'ms'
    );
    logger.info('Request completed', { duration });
  }
}

// Handle API route security
async function handleApiSecurity(
  request: NextRequest,
  requestId: string,
  logger: ReturnType<typeof Logger.withContext>
): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, pathname);
  if (rateLimitResult) {
    await AuditLogger.logSecurityEvent('rate_limit_exceeded', undefined, {
      ip: request.ip,
      endpoint: pathname,
      userAgent: request.headers.get('user-agent'),
    });
    return rateLimitResult;
  }

  // Validate authentication for protected routes
  if (isProtectedRoute(pathname)) {
    const authResult = await validateAuthentication(request);
    if (authResult.error) {
      await AuditLogger.logSecurityEvent('unauthorized_access', undefined, {
        ip: request.ip,
        endpoint: pathname,
        error: authResult.error,
      });

      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Add user context to request headers
    const response = NextResponse.next();
    if (authResult.user) {
      response.headers.set('x-user-id', authResult.user.id);
      response.headers.set('x-user-email', authResult.user.email || '');
    }
    response.headers.set('x-request-id', requestId);

    return response;
  }

  // Add request ID to all API responses
  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);
  return response;
}

// Handle page route security
async function handlePageSecurity(
  request: NextRequest,
  response: NextResponse,
  requestId: string,
  logger: ReturnType<typeof Logger.withContext>
): Promise<NextResponse> {
  // Add request ID to page responses
  response.headers.set('x-request-id', requestId);

  // Check for suspicious patterns in page requests
  await detectSuspiciousActivity(request, logger);

  return response;
}

// Apply rate limiting based on route
async function applyRateLimit(
  request: NextRequest,
  pathname: string
): Promise<NextResponse | null> {
  // Find matching rate limit configuration
  let rateLimit = rateLimits.general;

  for (const [route, limiter] of Object.entries(routeRateLimits)) {
    if (pathname.startsWith(route)) {
      rateLimit = limiter;
      break;
    }
  }

  return await rateLimit(request);
}

// Check if route requires authentication
function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/api/posts',
    '/api/users/profile',
    '/api/users/follow',
    '/api/users/unfollow',
    '/api/airdrops/bookmark',
    '/api/exchanges',
    '/api/wallets',
    '/api/notifications',
    '/api/messages',
  ];

  const publicRoutes = [
    '/api/auth/signin',
    '/api/auth/signup',
    '/api/auth/callback',
    '/api/posts/timeline', // Public timeline
    '/api/airdrops', // Public airdrop listings
    '/api/users/search', // Public user search
  ];

  // Check if it's explicitly public
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return false;
  }

  // Check if it's protected
  return protectedRoutes.some((route) => pathname.startsWith(route));
}

// Validate JWT token
async function validateAuthentication(
  request: NextRequest
): Promise<{ user?: any; error?: string }> {
  try {
    return await TokenValidator.validateToken(request);
  } catch (error) {
    return { error: 'Authentication failed' };
  }
}

// Detect suspicious activity patterns
async function detectSuspiciousActivity(
  request: NextRequest,
  logger: ReturnType<typeof Logger.withContext>
): Promise<void> {
  const userAgent = request.headers.get('user-agent') || '';
  const ip = request.ip || 'unknown';

  // Detect bot-like behavior
  const suspiciousBots = [
    'curl',
    'wget',
    'python-requests',
    'scrapy',
    'bot',
    'crawler',
    'spider',
  ];

  if (suspiciousBots.some((bot) => userAgent.toLowerCase().includes(bot))) {
    logger.warn('Suspicious bot detected', {
      userAgent,
      ip,
      url: request.url,
    });

    await AuditLogger.logSecurityEvent('suspicious_bot', undefined, {
      ip,
      userAgent,
      url: request.url,
    });
  }

  // Detect unusual request patterns
  const referer = request.headers.get('referer');
  if (!referer && request.method === 'POST') {
    logger.warn('POST request without referer', {
      ip,
      url: request.url,
      userAgent,
    });
  }

  // Detect potential SQL injection attempts in query parameters
  const url = new URL(request.url);
  const queryString = url.search.toLowerCase();
  const sqlInjectionPatterns = [
    'union select',
    'drop table',
    'insert into',
    'delete from',
    'update set',
    'script>',
    'javascript:',
    'onload=',
    'onerror=',
  ];

  if (sqlInjectionPatterns.some((pattern) => queryString.includes(pattern))) {
    logger.warn('Potential SQL injection attempt', {
      ip,
      url: request.url,
      queryString,
    });

    await AuditLogger.logSecurityEvent('sql_injection_attempt', undefined, {
      ip,
      url: request.url,
      queryString,
      severity: 'high',
    });
  }
}

// CORS handling for API routes
export function handleCors(request: NextRequest): NextResponse | null {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return null;
}
