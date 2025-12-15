// Comprehensive monitoring and observability system
import { Logger, LogLevel } from './error-handler';
import { PerformanceMonitor } from './performance';
import { supabase } from './supabase';

// Metric types
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer',
}

// Metric interface
export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp: Date;
  unit?: string;
}

// Health check status
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

// Health check result
export interface HealthCheckResult {
  service: string;
  status: HealthStatus;
  message?: string;
  responseTime?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Application Performance Monitoring
export class APMMonitor {
  private static metrics: Map<string, Metric[]> = new Map();
  private static healthChecks: Map<string, HealthCheckResult> = new Map();
  private static alertThresholds: Map<string, number> = new Map();

  // Initialize monitoring
  static initialize() {
    // Set default alert thresholds
    this.setAlertThreshold('response_time_p95', 5000); // 5 seconds
    this.setAlertThreshold('error_rate', 0.05); // 5%
    this.setAlertThreshold('memory_usage', 0.8); // 80%
    this.setAlertThreshold('cpu_usage', 0.8); // 80%
    this.setAlertThreshold('database_connections', 80); // 80 connections

    // Start periodic health checks
    this.startPeriodicHealthChecks();

    // Start metrics collection
    this.startMetricsCollection();

    Logger.withContext().info('APM monitoring initialized');
  }

  // Record metric
  static recordMetric(
    name: string,
    type: MetricType,
    value: number,
    labels?: Record<string, string>,
    unit?: string
  ): void {
    const metric: Metric = {
      name,
      type,
      value,
      labels,
      timestamp: new Date(),
      unit,
    };

    // Store metric in memory
    const existing = this.metrics.get(name) || [];
    existing.push(metric);

    // Keep only last 1000 metrics per name
    if (existing.length > 1000) {
      existing.shift();
    }

    this.metrics.set(name, existing);

    // Check for alerts
    this.checkAlerts(name, value);

    // Log high-priority metrics
    if (this.isHighPriorityMetric(name)) {
      Logger.withContext().info(`Metric recorded: ${name}`, {
        type,
        value,
        labels,
        unit,
      });
    }
  }

  // Record counter metric
  static counter(
    name: string,
    value: number = 1,
    labels?: Record<string, string>
  ): void {
    this.recordMetric(name, MetricType.COUNTER, value, labels);
  }

  // Record gauge metric
  static gauge(
    name: string,
    value: number,
    labels?: Record<string, string>,
    unit?: string
  ): void {
    this.recordMetric(name, MetricType.GAUGE, value, labels, unit);
  }

  // Record histogram metric
  static histogram(
    name: string,
    value: number,
    labels?: Record<string, string>,
    unit?: string
  ): void {
    this.recordMetric(name, MetricType.HISTOGRAM, value, labels, unit);
  }

  // Record timer metric
  static timer(name: string): () => void {
    const start = Date.now();

    return () => {
      const duration = Date.now() - start;
      this.recordMetric(name, MetricType.TIMER, duration, undefined, 'ms');
    };
  }

  // Set alert threshold
  static setAlertThreshold(metricName: string, threshold: number): void {
    this.alertThresholds.set(metricName, threshold);
  }

  // Check for alerts
  private static checkAlerts(metricName: string, value: number): void {
    const threshold = this.alertThresholds.get(metricName);
    if (!threshold) return;

    if (value > threshold) {
      this.triggerAlert(metricName, value, threshold);
    }
  }

  // Trigger alert
  private static async triggerAlert(
    metricName: string,
    value: number,
    threshold: number
  ): Promise<void> {
    const alert = {
      metric: metricName,
      value,
      threshold,
      severity: this.getAlertSeverity(metricName, value, threshold),
      timestamp: new Date(),
    };

    Logger.withContext().error(
      `Alert triggered: ${metricName}`,
      undefined,
      alert
    );

    // Store alert in database
    try {
      await supabase.from('monitoring_alerts').insert({
        metric_name: metricName,
        current_value: value,
        threshold_value: threshold,
        severity: alert.severity,
        metadata: alert,
      });
    } catch (error) {
      Logger.withContext().error('Failed to store alert', error as Error);
    }

    // Send notification (implement based on requirements)
    await this.sendAlertNotification(alert);
  }

  // Get alert severity
  private static getAlertSeverity(
    metricName: string,
    value: number,
    threshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = value / threshold;

    if (ratio >= 2.0) return 'critical';
    if (ratio >= 1.5) return 'high';
    if (ratio >= 1.2) return 'medium';
    return 'low';
  }

  // Send alert notification
  private static async sendAlertNotification(alert: any): Promise<void> {
    // Implement notification logic (email, Slack, webhook, etc.)
    if (process.env.ALERT_WEBHOOK_URL) {
      try {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert),
        });
      } catch (error) {
        Logger.withContext().error(
          'Failed to send alert notification',
          error as Error
        );
      }
    }
  }

  // Check if metric is high priority
  private static isHighPriorityMetric(name: string): boolean {
    const highPriorityMetrics = [
      'error_rate',
      'response_time_p95',
      'database_errors',
      'authentication_failures',
      'security_violations',
    ];

    return highPriorityMetrics.some((metric) => name.includes(metric));
  }

  // Get metrics
  static getMetrics(name?: string): Metric[] {
    if (name) {
      return this.metrics.get(name) || [];
    }

    const allMetrics: Metric[] = [];
    Array.from(this.metrics.values()).forEach((metrics) => {
      allMetrics.push(...metrics);
    });

    return allMetrics.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  // Get metric statistics
  static getMetricStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return null;

    const values = metrics.map((m) => m.value).sort((a, b) => a - b);
    const count = values.length;

    return {
      count,
      min: values[0],
      max: values[count - 1],
      avg: values.reduce((sum, val) => sum + val, 0) / count,
      p50: values[Math.floor(count * 0.5)],
      p95: values[Math.floor(count * 0.95)],
      p99: values[Math.floor(count * 0.99)],
    };
  }

  // Start periodic health checks
  private static startPeriodicHealthChecks(): void {
    // Run health checks every 30 seconds
    setInterval(async () => {
      await this.runAllHealthChecks();
    }, 30000);

    // Initial health check
    setTimeout(() => this.runAllHealthChecks(), 1000);
  }

  // Start metrics collection
  private static startMetricsCollection(): void {
    // Collect system metrics every 10 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 10000);

    // Initial collection
    setTimeout(() => this.collectSystemMetrics(), 1000);
  }

  // Run all health checks
  static async runAllHealthChecks(): Promise<void> {
    const checks = [
      this.checkDatabase(),
      this.checkSupabase(),
      this.checkRedis(),
      this.checkExternalAPIs(),
      this.checkFileSystem(),
      this.checkMemory(),
    ];

    const results = await Promise.allSettled(checks);

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        Logger.withContext().error(
          `Health check ${index} failed`,
          result.reason
        );
      }
    });
  }

  // Database health check
  static async checkDatabase(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      const responseTime = Date.now() - start;

      if (error) {
        const result: HealthCheckResult = {
          service: 'database',
          status: HealthStatus.UNHEALTHY,
          message: error.message,
          responseTime,
          timestamp: new Date(),
        };

        this.healthChecks.set('database', result);
        this.counter('health_check_failures', 1, { service: 'database' });
        return result;
      }

      const status =
        responseTime > 5000 ? HealthStatus.DEGRADED : HealthStatus.HEALTHY;

      const result: HealthCheckResult = {
        service: 'database',
        status,
        message: status === HealthStatus.DEGRADED ? 'Slow response time' : 'OK',
        responseTime,
        timestamp: new Date(),
      };

      this.healthChecks.set('database', result);
      this.gauge('database_response_time', responseTime, undefined, 'ms');

      return result;
    } catch (error) {
      const responseTime = Date.now() - start;

      const result: HealthCheckResult = {
        service: 'database',
        status: HealthStatus.UNHEALTHY,
        message: (error as Error).message,
        responseTime,
        timestamp: new Date(),
      };

      this.healthChecks.set('database', result);
      this.counter('health_check_failures', 1, { service: 'database' });

      return result;
    }
  }

  // Supabase health check
  static async checkSupabase(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const { data, error } = await supabase.auth.getSession();
      const responseTime = Date.now() - start;

      const status = error ? HealthStatus.DEGRADED : HealthStatus.HEALTHY;

      const result: HealthCheckResult = {
        service: 'supabase_auth',
        status,
        message: error ? error.message : 'OK',
        responseTime,
        timestamp: new Date(),
      };

      this.healthChecks.set('supabase_auth', result);
      this.gauge('supabase_response_time', responseTime, undefined, 'ms');

      return result;
    } catch (error) {
      const responseTime = Date.now() - start;

      const result: HealthCheckResult = {
        service: 'supabase_auth',
        status: HealthStatus.UNHEALTHY,
        message: (error as Error).message,
        responseTime,
        timestamp: new Date(),
      };

      this.healthChecks.set('supabase_auth', result);
      this.counter('health_check_failures', 1, { service: 'supabase_auth' });

      return result;
    }
  }

  // Redis health check (if available)
  static async checkRedis(): Promise<HealthCheckResult> {
    // Implement Redis health check if Redis is configured
    const result: HealthCheckResult = {
      service: 'redis',
      status: HealthStatus.HEALTHY,
      message: 'Not configured',
      timestamp: new Date(),
    };

    this.healthChecks.set('redis', result);
    return result;
  }

  // External APIs health check
  static async checkExternalAPIs(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      // Check a simple external service (example: httpbin)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://httpbin.org/status/200', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - start;
      const status = response.ok ? HealthStatus.HEALTHY : HealthStatus.DEGRADED;

      const result: HealthCheckResult = {
        service: 'external_apis',
        status,
        message: response.ok ? 'OK' : `HTTP ${response.status}`,
        responseTime,
        timestamp: new Date(),
      };

      this.healthChecks.set('external_apis', result);
      this.gauge('external_api_response_time', responseTime, undefined, 'ms');

      return result;
    } catch (error) {
      const responseTime = Date.now() - start;

      const result: HealthCheckResult = {
        service: 'external_apis',
        status: HealthStatus.UNHEALTHY,
        message: (error as Error).message,
        responseTime,
        timestamp: new Date(),
      };

      this.healthChecks.set('external_apis', result);
      this.counter('health_check_failures', 1, { service: 'external_apis' });

      return result;
    }
  }

  // File system health check
  static async checkFileSystem(): Promise<HealthCheckResult> {
    try {
      // Only perform file system checks in Node.js environment
      if (
        typeof process !== 'undefined' &&
        process.versions?.node &&
        typeof window === 'undefined'
      ) {
        try {
          const fs = await import('fs/promises');
          const testFile = `/tmp/health_check_${Date.now()}.txt`;
          await fs.writeFile(testFile, 'health check');
          await fs.unlink(testFile);
        } catch (fsError) {
          const result: HealthCheckResult = {
            service: 'filesystem',
            status: HealthStatus.DEGRADED,
            message: `File system error: ${(fsError as Error).message}`,
            timestamp: new Date(),
          };
          this.healthChecks.set('filesystem', result);
          return result;
        }
      }

      const result: HealthCheckResult = {
        service: 'filesystem',
        status: HealthStatus.HEALTHY,
        message:
          typeof window !== 'undefined'
            ? 'Browser environment - skipped'
            : 'OK',
        timestamp: new Date(),
      };

      this.healthChecks.set('filesystem', result);
      return result;
    } catch (error) {
      const result: HealthCheckResult = {
        service: 'filesystem',
        status: HealthStatus.UNHEALTHY,
        message: (error as Error).message,
        timestamp: new Date(),
      };

      this.healthChecks.set('filesystem', result);
      this.counter('health_check_failures', 1, { service: 'filesystem' });

      return result;
    }
  }

  // Memory health check
  static async checkMemory(): Promise<HealthCheckResult> {
    try {
      let memoryUsage = 0;
      let totalMemory = 0;

      // Skip memory check in Edge Runtime or browser environment
      if (
        typeof window !== 'undefined' ||
        (globalThis as any).EdgeRuntime !== undefined
      ) {
        const result: HealthCheckResult = {
          service: 'memory',
          status: HealthStatus.HEALTHY,
          message: 'Edge Runtime - memory check skipped',
          timestamp: new Date(),
        };

        this.healthChecks.set('memory', result);
        return result;
      }

      if (typeof process !== 'undefined' && process.memoryUsage) {
        try {
          const usage = process.memoryUsage();
          memoryUsage = usage.heapUsed;
          totalMemory = usage.heapTotal;
        } catch (memError) {
          // Memory usage not available
        }
      }

      const memoryPercent = totalMemory > 0 ? memoryUsage / totalMemory : 0;

      let status = HealthStatus.HEALTHY;
      let message = 'OK';

      if (memoryPercent > 0.9) {
        status = HealthStatus.UNHEALTHY;
        message = 'Critical memory usage';
      } else if (memoryPercent > 0.8) {
        status = HealthStatus.DEGRADED;
        message = 'High memory usage';
      }

      const result: HealthCheckResult = {
        service: 'memory',
        status,
        message,
        metadata: {
          memoryUsage: Math.round(memoryUsage / 1024 / 1024), // MB
          totalMemory: Math.round(totalMemory / 1024 / 1024), // MB
          memoryPercent: Math.round(memoryPercent * 100),
        },
        timestamp: new Date(),
      };

      this.healthChecks.set('memory', result);
      this.gauge('memory_usage_percent', memoryPercent * 100, undefined, '%');

      return result;
    } catch (error) {
      const result: HealthCheckResult = {
        service: 'memory',
        status: HealthStatus.UNHEALTHY,
        message: (error as Error).message,
        timestamp: new Date(),
      };

      this.healthChecks.set('memory', result);
      this.counter('health_check_failures', 1, { service: 'memory' });

      return result;
    }
  }

  // Collect system metrics
  private static collectSystemMetrics(): void {
    try {
      // Skip system metrics collection in Edge Runtime or browser environment
      if (
        typeof window !== 'undefined' ||
        (globalThis as any).EdgeRuntime !== undefined
      ) {
        return;
      }

      if (typeof process !== 'undefined' && process.memoryUsage) {
        try {
          const usage = process.memoryUsage();

          this.gauge('memory_heap_used', usage.heapUsed, undefined, 'bytes');
          this.gauge('memory_heap_total', usage.heapTotal, undefined, 'bytes');
          this.gauge('memory_external', usage.external, undefined, 'bytes');
          this.gauge('memory_rss', usage.rss, undefined, 'bytes');
        } catch (memError) {
          // Skip memory metrics if not available
        }
      }

      if (typeof process !== 'undefined' && process.cpuUsage) {
        try {
          const cpuUsage = process.cpuUsage();
          this.gauge('cpu_user_time', cpuUsage.user, undefined, 'microseconds');
          this.gauge(
            'cpu_system_time',
            cpuUsage.system,
            undefined,
            'microseconds'
          );
        } catch (cpuError) {
          // Skip CPU metrics if not available
        }
      }

      if (typeof process !== 'undefined' && process.uptime) {
        try {
          this.gauge('process_uptime', process.uptime(), undefined, 'seconds');
        } catch (uptimeError) {
          // Skip uptime metrics if not available
        }
      }

      // Collect performance metrics
      try {
        const perfStats = PerformanceMonitor.getStats();
        if (perfStats) {
          for (const [operation, stats] of Object.entries(perfStats)) {
            this.gauge(
              `operation_avg_time_${operation}`,
              stats.avgTime,
              undefined,
              'ms'
            );
            this.gauge(
              `operation_max_time_${operation}`,
              stats.maxTime,
              undefined,
              'ms'
            );
            this.counter(`operation_count_${operation}`, stats.count);
          }
        }
      } catch (perfError) {
        // Skip performance metrics if not available
      }
    } catch (error) {
      Logger.withContext().error(
        'Failed to collect system metrics',
        error as Error
      );
    }
  }

  // Get health status
  static getHealthStatus(): Record<string, HealthCheckResult> {
    return Object.fromEntries(this.healthChecks.entries());
  }

  // Get overall health
  static getOverallHealth(): {
    status: HealthStatus;
    services: Record<string, HealthCheckResult>;
    summary: {
      healthy: number;
      degraded: number;
      unhealthy: number;
      total: number;
    };
  } {
    const services = this.getHealthStatus();
    const summary = {
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      total: 0,
    };

    for (const result of Object.values(services)) {
      summary.total++;
      switch (result.status) {
        case HealthStatus.HEALTHY:
          summary.healthy++;
          break;
        case HealthStatus.DEGRADED:
          summary.degraded++;
          break;
        case HealthStatus.UNHEALTHY:
          summary.unhealthy++;
          break;
      }
    }

    let overallStatus = HealthStatus.HEALTHY;
    if (summary.unhealthy > 0) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (summary.degraded > 0) {
      overallStatus = HealthStatus.DEGRADED;
    }

    return {
      status: overallStatus,
      services,
      summary,
    };
  }
}

// Request monitoring middleware
export function withRequestMonitoring<T extends any[], R>(
  operationName: string,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const endTimer = APMMonitor.timer(`request_${operationName}`);
    APMMonitor.counter(`request_count`, 1, { operation: operationName });

    try {
      const result = await fn(...args);
      APMMonitor.counter(`request_success`, 1, { operation: operationName });
      return result;
    } catch (error) {
      APMMonitor.counter(`request_error`, 1, {
        operation: operationName,
        error_type: (error as Error).name,
      });
      throw error;
    } finally {
      endTimer();
    }
  };
}

// Database monitoring wrapper
export function withDatabaseMonitoring<T extends any[], R>(
  queryName: string,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const endTimer = APMMonitor.timer(`db_query_${queryName}`);
    APMMonitor.counter(`db_query_count`, 1, { query: queryName });

    try {
      const result = await fn(...args);
      APMMonitor.counter(`db_query_success`, 1, { query: queryName });
      return result;
    } catch (error) {
      APMMonitor.counter(`db_query_error`, 1, {
        query: queryName,
        error_type: (error as Error).name,
      });
      throw error;
    } finally {
      endTimer();
    }
  };
}
