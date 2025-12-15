// Monitoring initialization and setup
import React from 'react';
import { APMMonitor } from './monitoring';
import { Logger } from './error-handler';

// Initialize monitoring system
export function initializeMonitoring() {
  try {
    // Initialize APM monitoring
    APMMonitor.initialize();

    // Set up global error handlers
    setupGlobalErrorHandlers();

    // Set up performance observers
    setupPerformanceObservers();

    // Set up custom metrics collection
    setupCustomMetrics();

    Logger.withContext().info('Monitoring system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize monitoring:', error);
  }
}

// Set up global error handlers
function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  if (typeof process !== 'undefined') {
    process.on('unhandledRejection', (reason, promise) => {
      Logger.withContext().fatal(
        'Unhandled promise rejection',
        reason as Error,
        {
          promise: promise.toString(),
        }
      );

      APMMonitor.counter('unhandled_promise_rejection', 1);
    });

    process.on('uncaughtException', (error) => {
      Logger.withContext().fatal('Uncaught exception', error);

      APMMonitor.counter('uncaught_exception', 1);

      // Graceful shutdown
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });
  }

  // Handle browser errors
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      Logger.withContext().error('Global error', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });

      APMMonitor.counter('browser_error', 1, {
        type: 'javascript_error',
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      Logger.withContext().error('Unhandled promise rejection', event.reason);

      APMMonitor.counter('browser_error', 1, {
        type: 'unhandled_rejection',
      });
    });
  }
}

// Set up performance observers
function setupPerformanceObservers() {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;

            APMMonitor.gauge(
              'page_load_time',
              navEntry.loadEventEnd - navEntry.fetchStart,
              undefined,
              'ms'
            );
            APMMonitor.gauge(
              'dom_content_loaded',
              navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
              undefined,
              'ms'
            );
            APMMonitor.gauge(
              'first_paint',
              navEntry.responseEnd - navEntry.requestStart,
              undefined,
              'ms'
            );
          }
        }
      });

      navObserver.observe({ entryTypes: ['navigation'] });

      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;

            APMMonitor.histogram(
              'resource_load_time',
              resourceEntry.duration,
              {
                resource_type: resourceEntry.initiatorType,
              },
              'ms'
            );
          }
        }
      });

      resourceObserver.observe({ entryTypes: ['resource'] });

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          APMMonitor.gauge(
            'largest_contentful_paint',
            entry.startTime,
            undefined,
            'ms'
          );
        }
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Observe first input delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          APMMonitor.gauge(
            'first_input_delay',
            (entry as any).processingStart - entry.startTime,
            undefined,
            'ms'
          );
        }
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('Performance observers not fully supported:', error);
    }
  }
}

// Set up custom metrics collection
function setupCustomMetrics() {
  // Collect metrics every 30 seconds
  setInterval(() => {
    collectApplicationMetrics();
  }, 30000);

  // Initial collection
  setTimeout(collectApplicationMetrics, 1000);
}

// Collect application-specific metrics
function collectApplicationMetrics() {
  try {
    // Browser-specific metrics
    if (typeof window !== 'undefined') {
      // Connection information
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          APMMonitor.gauge(
            'network_effective_type',
            getConnectionTypeValue(connection.effectiveType)
          );
          APMMonitor.gauge(
            'network_downlink',
            connection.downlink,
            undefined,
            'mbps'
          );
          APMMonitor.gauge('network_rtt', connection.rtt, undefined, 'ms');
        }
      }

      // Memory information
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        APMMonitor.gauge(
          'js_heap_used',
          memory.usedJSHeapSize,
          undefined,
          'bytes'
        );
        APMMonitor.gauge(
          'js_heap_total',
          memory.totalJSHeapSize,
          undefined,
          'bytes'
        );
        APMMonitor.gauge(
          'js_heap_limit',
          memory.jsHeapSizeLimit,
          undefined,
          'bytes'
        );
      }

      // Page visibility
      APMMonitor.gauge(
        'page_visible',
        document.visibilityState === 'visible' ? 1 : 0
      );

      // Local storage usage
      try {
        const localStorageSize = JSON.stringify(localStorage).length;
        APMMonitor.gauge(
          'local_storage_size',
          localStorageSize,
          undefined,
          'bytes'
        );
      } catch (error) {
        // Local storage not available
      }
    }

    // Node.js specific metrics
    if (typeof process !== 'undefined') {
      // Event loop lag
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
        APMMonitor.gauge('event_loop_lag', lag, undefined, 'ms');
      });

      // Active handles and requests
      if ((process as any)._getActiveHandles) {
        APMMonitor.gauge(
          'active_handles',
          (process as any)._getActiveHandles().length
        );
      }

      if ((process as any)._getActiveRequests) {
        APMMonitor.gauge(
          'active_requests',
          (process as any)._getActiveRequests().length
        );
      }
    }
  } catch (error) {
    Logger.withContext().error(
      'Failed to collect application metrics',
      error as Error
    );
  }
}

// Convert connection type to numeric value for metrics
function getConnectionTypeValue(effectiveType: string): number {
  const types: Record<string, number> = {
    'slow-2g': 1,
    '2g': 2,
    '3g': 3,
    '4g': 4,
  };

  return types[effectiveType] || 0;
}

// Monitoring middleware for Next.js API routes
export function withMonitoring(handler: (req: any, res: any) => Promise<any>) {
  return async (req: any, res: any) => {
    const startTime = Date.now();
    const endTimer = APMMonitor.timer('api_request_duration');

    // Record request
    APMMonitor.counter('api_requests_total', 1, {
      method: req.method,
      route: req.url,
    });

    try {
      const result = await handler(req, res);

      // Record success
      APMMonitor.counter('api_requests_success', 1, {
        method: req.method,
        route: req.url,
        status_code: res.statusCode?.toString() || 'unknown',
      });

      return result;
    } catch (error) {
      // Record error
      APMMonitor.counter('api_requests_error', 1, {
        method: req.method,
        route: req.url,
        error_type: (error as Error).name,
      });

      throw error;
    } finally {
      endTimer();

      // Record response time
      const responseTime = Date.now() - startTime;
      APMMonitor.histogram(
        'api_response_time',
        responseTime,
        {
          method: req.method,
          route: req.url,
        },
        'ms'
      );
    }
  };
}

// Database query monitoring wrapper
export function withDatabaseMonitoring(queryName: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const endTimer = APMMonitor.timer(`db_query_${queryName}`);

      APMMonitor.counter('db_queries_total', 1, {
        query: queryName,
      });

      try {
        const result = await method.apply(this, args);

        APMMonitor.counter('db_queries_success', 1, {
          query: queryName,
        });

        return result;
      } catch (error) {
        APMMonitor.counter('db_queries_error', 1, {
          query: queryName,
          error_type: (error as Error).name,
        });

        throw error;
      } finally {
        endTimer();
      }
    };

    return descriptor;
  };
}

// Component performance monitoring
export function withComponentMonitoring(componentName: string) {
  return function <T extends React.ComponentType<any>>(Component: T): T {
    const MonitoredComponent = (props: any) => {
      const startTime = Date.now();

      React.useEffect(() => {
        const renderTime = Date.now() - startTime;
        APMMonitor.histogram(
          'component_render_time',
          renderTime,
          {
            component: componentName,
          },
          'ms'
        );
      });

      return React.createElement(Component, props);
    };

    MonitoredComponent.displayName = `Monitored(${componentName})`;
    return MonitoredComponent as T;
  };
}
