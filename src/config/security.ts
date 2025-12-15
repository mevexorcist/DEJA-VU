// Security and performance configuration
export const SecurityConfig = {
  // Rate limiting configuration
  rateLimits: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
    },
    posting: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
    },
    search: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30,
    },
  },

  // Content validation limits
  content: {
    maxPostLength: 2000,
    maxUsernameLength: 20,
    minUsernameLength: 3,
    maxSearchQueryLength: 100,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxImageSize: 5 * 1024 * 1024, // 5MB
  },

  // Password requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },

  // Session configuration
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    refreshThreshold: 60 * 60 * 1000, // 1 hour before expiry
  },

  // CORS configuration
  cors: {
    allowedOrigins: [
      'http://localhost:3000',
      'https://deja-vu.app',
      'https://*.deja-vu.app',
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400, // 24 hours
  },

  // Security headers
  headers: {
    contentSecurityPolicy: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'data:'],
      'connect-src': ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  },
};

export const PerformanceConfig = {
  // Cache configuration
  cache: {
    defaultTTL: 300, // 5 minutes
    maxSize: 1000, // Maximum number of cached items
    cleanupInterval: 60000, // 1 minute
  },

  // Database configuration
  database: {
    connectionPool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 300000, // 5 minutes
    },
    queryTimeout: 30000, // 30 seconds
    maxQueryComplexity: 100,
  },

  // Image optimization
  images: {
    defaultQuality: 80,
    formats: ['webp', 'jpeg', 'png'],
    sizes: [320, 640, 960, 1280, 1920],
    lazyLoadThreshold: 100, // pixels
  },

  // Bundle optimization
  bundle: {
    chunkSizeLimit: 244 * 1024, // 244KB
    enableTreeShaking: true,
    enableMinification: true,
    enableGzip: true,
  },

  // Memory limits
  memory: {
    maxHeapSize: 512 * 1024 * 1024, // 512MB
    gcThreshold: 0.8, // 80% of max heap
    warningThreshold: 0.7, // 70% of max heap
  },

  // Network optimization
  network: {
    requestTimeout: 10000, // 10 seconds
    maxRetries: 3,
    retryDelay: 1000, // 1 second base delay
    batchSize: 10,
    batchDelay: 100, // 100ms
  },
};

export const MonitoringConfig = {
  // Performance monitoring
  performance: {
    slowQueryThreshold: 1000, // 1 second
    slowOperationThreshold: 5000, // 5 seconds
    memoryWarningThreshold: 50 * 1024 * 1024, // 50MB
    enableMetrics: true,
  },

  // Error tracking
  errors: {
    logLevel: 'error',
    enableStackTrace: true,
    enableSourceMap: true,
    maxErrorsPerMinute: 100,
  },

  // Audit logging
  audit: {
    enableSecurityEvents: true,
    enablePerformanceEvents: true,
    retentionDays: 90,
    criticalEvents: [
      'failed_login',
      'rate_limit_exceeded',
      'security_violation',
      'data_breach_attempt',
    ],
  },
};

// Environment-specific overrides
export const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';

  const configs = {
    development: {
      security: {
        ...SecurityConfig,
        rateLimits: {
          ...SecurityConfig.rateLimits,
          general: { ...SecurityConfig.rateLimits.general, maxRequests: 1000 },
        },
      },
      performance: {
        ...PerformanceConfig,
        cache: { ...PerformanceConfig.cache, defaultTTL: 60 },
      },
      monitoring: {
        ...MonitoringConfig,
        performance: { ...MonitoringConfig.performance, enableMetrics: false },
      },
    },

    production: {
      security: SecurityConfig,
      performance: PerformanceConfig,
      monitoring: MonitoringConfig,
    },

    test: {
      security: {
        ...SecurityConfig,
        rateLimits: {
          ...SecurityConfig.rateLimits,
          general: { ...SecurityConfig.rateLimits.general, maxRequests: 10000 },
        },
      },
      performance: {
        ...PerformanceConfig,
        cache: { ...PerformanceConfig.cache, defaultTTL: 1 },
      },
      monitoring: {
        ...MonitoringConfig,
        performance: { ...MonitoringConfig.performance, enableMetrics: false },
        errors: { ...MonitoringConfig.errors, logLevel: 'warn' },
      },
    },
  };

  return configs[env as keyof typeof configs] || configs.production;
};
