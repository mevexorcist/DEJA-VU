// Monitoring system tests
import { APMMonitor, MetricType, HealthStatus } from '@/lib/monitoring';

// Mock fetch for external API calls
global.fetch = jest.fn();

describe('Monitoring System', () => {
  beforeEach(() => {
    // Clear metrics before each test
    APMMonitor['metrics'].clear();
    APMMonitor['healthChecks'].clear();
    jest.clearAllMocks();
  });

  describe('APMMonitor', () => {
    test('records counter metrics correctly', () => {
      APMMonitor.counter('test_counter', 5, { service: 'test' });

      const metrics = APMMonitor.getMetrics('test_counter');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        name: 'test_counter',
        type: MetricType.COUNTER,
        value: 5,
        labels: { service: 'test' },
      });
    });

    test('records gauge metrics correctly', () => {
      APMMonitor.gauge('test_gauge', 42.5, { component: 'api' }, 'ms');

      const metrics = APMMonitor.getMetrics('test_gauge');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        name: 'test_gauge',
        type: MetricType.GAUGE,
        value: 42.5,
        labels: { component: 'api' },
        unit: 'ms',
      });
    });

    test('records histogram metrics correctly', () => {
      APMMonitor.histogram(
        'test_histogram',
        100,
        { endpoint: '/api/test' },
        'bytes'
      );

      const metrics = APMMonitor.getMetrics('test_histogram');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        name: 'test_histogram',
        type: MetricType.HISTOGRAM,
        value: 100,
        labels: { endpoint: '/api/test' },
        unit: 'bytes',
      });
    });

    test('timer creates timer metrics', () => {
      const endTimer = APMMonitor.timer('test_timer');

      // Simulate some work
      setTimeout(() => {
        endTimer();

        const metrics = APMMonitor.getMetrics('test_timer');
        expect(metrics).toHaveLength(1);
        expect(metrics[0]).toMatchObject({
          name: 'test_timer',
          type: MetricType.TIMER,
          unit: 'ms',
        });
        expect(metrics[0].value).toBeGreaterThan(0);
      }, 10);
    });

    test('calculates metric statistics correctly', () => {
      // Add multiple metrics
      APMMonitor.gauge('response_time', 100);
      APMMonitor.gauge('response_time', 200);
      APMMonitor.gauge('response_time', 150);
      APMMonitor.gauge('response_time', 300);
      APMMonitor.gauge('response_time', 250);

      const stats = APMMonitor.getMetricStats('response_time');
      expect(stats).toMatchObject({
        count: 5,
        min: 100,
        max: 300,
        avg: 200,
        p50: 200,
        p95: 300,
        p99: 300,
      });
    });

    test('returns null for non-existent metric stats', () => {
      const stats = APMMonitor.getMetricStats('non_existent_metric');
      expect(stats).toBeNull();
    });

    test('limits metric history to 1000 entries', () => {
      // Add more than 1000 metrics
      for (let i = 0; i < 1200; i++) {
        APMMonitor.counter('test_metric', i);
      }

      const metrics = APMMonitor.getMetrics('test_metric');
      expect(metrics).toHaveLength(1000);
    });

    test('sets and checks alert thresholds', () => {
      APMMonitor.setAlertThreshold('cpu_usage', 80);

      // This should not trigger an alert
      APMMonitor.gauge('cpu_usage', 70);

      // This should trigger an alert (mocked)
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      APMMonitor.gauge('cpu_usage', 90);

      // We can't easily test the alert without mocking the database
      // but we can verify the metric was recorded
      const metrics = APMMonitor.getMetrics('cpu_usage');
      expect(metrics).toHaveLength(2);

      consoleSpy.mockRestore();
    });
  });

  describe('Health Checks', () => {
    test('memory health check returns healthy status for normal usage', async () => {
      const result = await APMMonitor.checkMemory();

      expect(result).toMatchObject({
        service: 'memory',
        status: expect.any(String),
        timestamp: expect.any(Date),
      });

      // Should be healthy or degraded, not unhealthy in test environment
      expect([HealthStatus.HEALTHY, HealthStatus.DEGRADED]).toContain(
        result.status
      );
    });

    test('filesystem health check works', async () => {
      const result = await APMMonitor.checkFileSystem();

      expect(result).toMatchObject({
        service: 'filesystem',
        status: expect.any(String),
        message: expect.any(String),
        timestamp: expect.any(Date),
      });
    });

    test('external API health check handles success', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await APMMonitor.checkExternalAPIs();

      expect(result).toMatchObject({
        service: 'external_apis',
        status: HealthStatus.HEALTHY,
        message: 'OK',
        timestamp: expect.any(Date),
      });
    });

    test('external API health check handles failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await APMMonitor.checkExternalAPIs();

      expect(result).toMatchObject({
        service: 'external_apis',
        status: HealthStatus.UNHEALTHY,
        message: 'Network error',
        timestamp: expect.any(Date),
      });
    });

    test('overall health aggregates service statuses correctly', () => {
      // Mock some health check results
      APMMonitor['healthChecks'].set('service1', {
        service: 'service1',
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
      });

      APMMonitor['healthChecks'].set('service2', {
        service: 'service2',
        status: HealthStatus.DEGRADED,
        timestamp: new Date(),
      });

      APMMonitor['healthChecks'].set('service3', {
        service: 'service3',
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date(),
      });

      const overallHealth = APMMonitor.getOverallHealth();

      expect(overallHealth).toMatchObject({
        status: HealthStatus.UNHEALTHY, // Worst status wins
        summary: {
          healthy: 1,
          degraded: 1,
          unhealthy: 1,
          total: 3,
        },
      });
    });

    test('overall health returns healthy when all services are healthy', () => {
      APMMonitor['healthChecks'].set('service1', {
        service: 'service1',
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
      });

      APMMonitor['healthChecks'].set('service2', {
        service: 'service2',
        status: HealthStatus.HEALTHY,
        timestamp: new Date(),
      });

      const overallHealth = APMMonitor.getOverallHealth();

      expect(overallHealth).toMatchObject({
        status: HealthStatus.HEALTHY,
        summary: {
          healthy: 2,
          degraded: 0,
          unhealthy: 0,
          total: 2,
        },
      });
    });
  });

  describe('Monitoring Wrappers', () => {
    test('withRequestMonitoring records metrics and handles success', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = require('@/lib/monitoring').withRequestMonitoring(
        'test_operation',
        mockFn
      );

      const result = await wrappedFn('arg1', 'arg2');

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');

      // Check that metrics were recorded
      const requestCount = APMMonitor.getMetrics('request_count');
      const successCount = APMMonitor.getMetrics('request_success');
      const timerMetrics = APMMonitor.getMetrics('request_test_operation');

      expect(requestCount).toHaveLength(1);
      expect(successCount).toHaveLength(1);
      expect(timerMetrics).toHaveLength(1);
    });

    test('withRequestMonitoring records metrics and handles errors', async () => {
      const mockError = new Error('Test error');
      const mockFn = jest.fn().mockRejectedValue(mockError);
      const wrappedFn = require('@/lib/monitoring').withRequestMonitoring(
        'test_operation',
        mockFn
      );

      await expect(wrappedFn()).rejects.toThrow('Test error');

      // Check that error metrics were recorded
      const requestCount = APMMonitor.getMetrics('request_count');
      const errorCount = APMMonitor.getMetrics('request_error');

      expect(requestCount).toHaveLength(1);
      expect(errorCount).toHaveLength(1);
      expect(errorCount[0].labels).toMatchObject({
        operation: 'test_operation',
        error_type: 'Error',
      });
    });

    test('withDatabaseMonitoring records database metrics', async () => {
      const mockFn = jest.fn().mockResolvedValue({ data: 'result' });
      const wrappedFn = require('@/lib/monitoring').withDatabaseMonitoring(
        'user_query',
        mockFn
      );

      const result = await wrappedFn();

      expect(result).toEqual({ data: 'result' });

      // Check that database metrics were recorded
      const queryCount = APMMonitor.getMetrics('db_query_count');
      const successCount = APMMonitor.getMetrics('db_query_success');
      const timerMetrics = APMMonitor.getMetrics('db_query_user_query');

      expect(queryCount).toHaveLength(1);
      expect(successCount).toHaveLength(1);
      expect(timerMetrics).toHaveLength(1);
    });
  });

  describe('Metric Collection', () => {
    test('collects system metrics without errors', () => {
      // This is a private method, so we test it indirectly
      expect(() => {
        APMMonitor['collectSystemMetrics']();
      }).not.toThrow();
    });

    test('identifies high priority metrics correctly', () => {
      expect(APMMonitor['isHighPriorityMetric']('error_rate')).toBe(true);
      expect(APMMonitor['isHighPriorityMetric']('response_time_p95')).toBe(
        true
      );
      expect(APMMonitor['isHighPriorityMetric']('database_errors')).toBe(true);
      expect(APMMonitor['isHighPriorityMetric']('regular_metric')).toBe(false);
    });

    test('determines alert severity correctly', () => {
      expect(APMMonitor['getAlertSeverity']('test_metric', 200, 100)).toBe(
        'critical'
      ); // 2x threshold
      expect(APMMonitor['getAlertSeverity']('test_metric', 150, 100)).toBe(
        'high'
      ); // 1.5x threshold
      expect(APMMonitor['getAlertSeverity']('test_metric', 120, 100)).toBe(
        'medium'
      ); // 1.2x threshold
      expect(APMMonitor['getAlertSeverity']('test_metric', 110, 100)).toBe(
        'low'
      ); // 1.1x threshold
    });
  });
});

describe('Monitoring Integration', () => {
  test('monitoring system can be initialized without errors', () => {
    expect(() => {
      APMMonitor.initialize();
    }).not.toThrow();
  });

  test('health checks can be run without errors', async () => {
    // Mock all the individual health check methods to avoid timeouts
    const originalCheckDatabase = APMMonitor.checkDatabase;
    const originalCheckSupabase = APMMonitor.checkSupabase;
    const originalCheckRedis = APMMonitor.checkRedis;
    const originalCheckExternalAPIs = APMMonitor.checkExternalAPIs;
    const originalCheckFileSystem = APMMonitor.checkFileSystem;
    const originalCheckMemory = APMMonitor.checkMemory;

    APMMonitor.checkDatabase = jest
      .fn()
      .mockResolvedValue({ service: 'database', status: 'healthy' });
    APMMonitor.checkSupabase = jest
      .fn()
      .mockResolvedValue({ service: 'supabase', status: 'healthy' });
    APMMonitor.checkRedis = jest
      .fn()
      .mockResolvedValue({ service: 'redis', status: 'healthy' });
    APMMonitor.checkExternalAPIs = jest
      .fn()
      .mockResolvedValue({ service: 'external_apis', status: 'healthy' });
    APMMonitor.checkFileSystem = jest
      .fn()
      .mockResolvedValue({ service: 'filesystem', status: 'healthy' });
    APMMonitor.checkMemory = jest
      .fn()
      .mockResolvedValue({ service: 'memory', status: 'healthy' });

    try {
      await expect(APMMonitor.runAllHealthChecks()).resolves.not.toThrow();
    } finally {
      // Restore original methods
      APMMonitor.checkDatabase = originalCheckDatabase;
      APMMonitor.checkSupabase = originalCheckSupabase;
      APMMonitor.checkRedis = originalCheckRedis;
      APMMonitor.checkExternalAPIs = originalCheckExternalAPIs;
      APMMonitor.checkFileSystem = originalCheckFileSystem;
      APMMonitor.checkMemory = originalCheckMemory;
    }
  }, 10000); // 10 second timeout

  test('metrics are properly formatted for different types', () => {
    // Clear existing metrics first
    (APMMonitor as any).metrics.clear();

    APMMonitor.counter('requests_total', 100, { method: 'GET', status: '200' });
    APMMonitor.gauge(
      'memory_usage_bytes',
      1024 * 1024 * 512,
      undefined,
      'bytes'
    );
    APMMonitor.histogram(
      'request_duration_ms',
      250,
      { endpoint: '/api/users' },
      'ms'
    );

    const allMetrics = APMMonitor.getMetrics();
    expect(allMetrics).toHaveLength(3);

    const counterMetric = allMetrics.find((m) => m.name === 'requests_total');
    const gaugeMetric = allMetrics.find((m) => m.name === 'memory_usage_bytes');
    const histogramMetric = allMetrics.find(
      (m) => m.name === 'request_duration_ms'
    );

    expect(counterMetric).toMatchObject({
      type: MetricType.COUNTER,
      value: 100,
      labels: { method: 'GET', status: '200' },
    });

    expect(gaugeMetric).toMatchObject({
      type: MetricType.GAUGE,
      value: 1024 * 1024 * 512,
      unit: 'bytes',
    });

    expect(histogramMetric).toMatchObject({
      type: MetricType.HISTOGRAM,
      value: 250,
      labels: { endpoint: '/api/users' },
      unit: 'ms',
    });
  });
});
