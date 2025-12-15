'use client';

import React, { useState, useEffect } from 'react';
import { HealthStatus } from '@/lib/monitoring';

// Types
interface HealthCheckResult {
  service: string;
  status: HealthStatus;
  message?: string;
  responseTime?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

interface Alert {
  id: string;
  metric_name: string;
  current_value: number;
  threshold_value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  metadata?: any;
}

interface Metric {
  name: string;
  type: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: Date;
  unit?: string;
}

// Main dashboard component
export default function MonitoringDashboard() {
  const [healthData, setHealthData] = useState<any>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Fetch health data
  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health/detailed');
      if (!response.ok) throw new Error('Failed to fetch health data');
      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts?limit=20');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  // Fetch metrics
  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics?timeWindow=1h');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data.metrics || []);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchHealthData(), fetchAlerts(), fetchMetrics()]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh
  useEffect(() => {
    fetchAllData();

    const interval = setInterval(fetchAllData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Acknowledge alert
  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'acknowledged',
          acknowledgedBy: 'dashboard-user', // In real app, use actual user ID
        }),
      });

      if (response.ok) {
        fetchAlerts(); // Refresh alerts
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  if (loading && !healthData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading monitoring dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchAllData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                System Monitoring
              </h1>
              <p className="text-gray-600 mt-1">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
                <option value={60000}>1m</option>
                <option value={300000}>5m</option>
              </select>
              <button
                onClick={fetchAllData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Overall Status */}
        <div className="mb-8">
          <OverallStatusCard healthData={healthData} />
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <AlertsSection alerts={alerts} onAcknowledge={acknowledgeAlert} />
          </div>
        )}

        {/* Services Health */}
        <div className="mb-8">
          <ServicesHealthSection services={healthData?.services || {}} />
        </div>

        {/* System Metrics */}
        <div className="mb-8">
          <SystemMetricsSection
            memoryUsage={healthData?.memoryUsage}
            uptime={healthData?.uptime}
            metrics={metrics}
          />
        </div>

        {/* Performance Metrics */}
        <div className="mb-8">
          <PerformanceMetricsSection
            performanceMetrics={healthData?.performanceMetrics || []}
          />
        </div>
      </div>
    </div>
  );
}

// Overall status card
function OverallStatusCard({ healthData }: { healthData: any }) {
  if (!healthData) return null;

  const statusColors = {
    healthy: 'bg-green-100 text-green-800 border-green-200',
    degraded: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    unhealthy: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusIcons = {
    healthy: '✅',
    degraded: '⚠️',
    unhealthy: '❌',
  };

  return (
    <div
      className={`p-6 rounded-lg border-2 ${statusColors[healthData.status as keyof typeof statusColors]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            {statusIcons[healthData.status as keyof typeof statusIcons]}
            <span className="ml-2 capitalize">{healthData.status}</span>
          </h2>
          <p className="mt-2">
            {healthData.summary.healthy} healthy, {healthData.summary.degraded}{' '}
            degraded, {healthData.summary.unhealthy} unhealthy
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Uptime</div>
          <div className="text-xl font-mono">
            {healthData.uptime ? formatUptime(healthData.uptime) : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Alerts section
function AlertsSection({
  alerts,
  onAcknowledge,
}: {
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
}) {
  const severityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">Active Alerts</h3>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${severityColors[alert.severity]}`}
                >
                  {alert.severity.toUpperCase()}
                </span>
                <span className="font-medium">{alert.metric_name}</span>
              </div>
              <p className="text-gray-600 mt-1">
                Current: {alert.current_value} | Threshold:{' '}
                {alert.threshold_value}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(alert.created_at).toLocaleString()}
              </p>
            </div>
            {alert.status === 'active' && (
              <button
                onClick={() => onAcknowledge(alert.id)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Acknowledge
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Services health section
function ServicesHealthSection({
  services,
}: {
  services: Record<string, HealthCheckResult>;
}) {
  const statusColors = {
    healthy: 'text-green-600',
    degraded: 'text-yellow-600',
    unhealthy: 'text-red-600',
  };

  const statusIcons = {
    healthy: '✅',
    degraded: '⚠️',
    unhealthy: '❌',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">Services Health</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(services).map(([serviceName, service]) => (
          <div key={serviceName} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium capitalize">
                {serviceName.replace('_', ' ')}
              </h4>
              <span className={statusColors[service.status]}>
                {statusIcons[service.status]}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">{service.message}</p>
            {service.responseTime && (
              <p className="text-xs text-gray-500">
                Response: {service.responseTime}ms
              </p>
            )}
            <p className="text-xs text-gray-400">
              {new Date(service.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// System metrics section
function SystemMetricsSection({
  memoryUsage,
  uptime,
  metrics,
}: {
  memoryUsage: any;
  uptime: number;
  metrics: Metric[];
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">System Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Memory Usage */}
        {memoryUsage && (
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Memory Usage</h4>
            <div className="space-y-1 text-sm">
              <div>Heap Used: {memoryUsage.heapUsed} MB</div>
              <div>Heap Total: {memoryUsage.heapTotal} MB</div>
              <div>RSS: {memoryUsage.rss} MB</div>
            </div>
          </div>
        )}

        {/* Uptime */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Uptime</h4>
          <div className="text-lg font-mono">
            {uptime ? formatUptime(uptime) : 'N/A'}
          </div>
        </div>

        {/* Recent Metrics */}
        <div className="p-4 border rounded-lg md:col-span-2">
          <h4 className="font-medium mb-2">Recent Metrics</h4>
          <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
            {metrics.slice(0, 10).map((metric, index) => (
              <div key={index} className="flex justify-between">
                <span className="truncate">{metric.name}</span>
                <span className="font-mono">
                  {metric.value}
                  {metric.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Performance metrics section
function PerformanceMetricsSection({
  performanceMetrics,
}: {
  performanceMetrics: any[];
}) {
  if (!performanceMetrics || performanceMetrics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Performance Metrics</h3>
        <p className="text-gray-500">No performance metrics available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">Performance Metrics</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Metric</th>
              <th className="text-left py-2">Current</th>
              <th className="text-left py-2">Average</th>
              <th className="text-left py-2">Min/Max</th>
              <th className="text-left py-2">Samples</th>
            </tr>
          </thead>
          <tbody>
            {performanceMetrics.map((metric, index) => (
              <tr key={index} className="border-b">
                <td className="py-2 font-medium">{metric.metric_name}</td>
                <td className="py-2 font-mono">{metric.current_value}</td>
                <td className="py-2 font-mono">
                  {metric.avg_value?.toFixed(2)}
                </td>
                <td className="py-2 font-mono text-sm">
                  {metric.min_value?.toFixed(2)} /{' '}
                  {metric.max_value?.toFixed(2)}
                </td>
                <td className="py-2">{metric.sample_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper function to format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
