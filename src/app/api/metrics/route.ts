// Metrics API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { APMMonitor } from '@/lib/monitoring';
import { asyncHandler } from '@/lib/error-handler';
import { supabase } from '@/lib/supabase';

// GET /api/metrics - Get application metrics
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const metricName = url.searchParams.get('name');
    const format = url.searchParams.get('format') || 'json';
    const timeWindow = url.searchParams.get('timeWindow') || '1h';

    // Get metrics from memory
    const metrics = metricName
      ? APMMonitor.getMetrics(metricName)
      : APMMonitor.getMetrics();

    // Get metric statistics
    const stats = metricName ? APMMonitor.getMetricStats(metricName) : null;

    // Get historical metrics from database if requested
    let historicalMetrics = null;
    if (url.searchParams.get('includeHistorical') === 'true') {
      try {
        const interval =
          timeWindow === '24h'
            ? '24 hours'
            : timeWindow === '7d'
              ? '7 days'
              : timeWindow === '30d'
                ? '30 days'
                : '1 hour';

        const { data } = await supabase
          .from('monitoring_metrics')
          .select('*')
          .gte(
            'created_at',
            new Date(Date.now() - getIntervalMs(interval)).toISOString()
          )
          .order('created_at', { ascending: false })
          .limit(1000);

        historicalMetrics = data;
      } catch (error) {
        console.error('Failed to get historical metrics:', error);
      }
    }

    // Format response based on requested format
    if (format === 'prometheus') {
      return new Response(formatPrometheusMetrics(metrics), {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        },
      });
    }

    return NextResponse.json({
      metrics,
      stats,
      historicalMetrics,
      timestamp: new Date().toISOString(),
      timeWindow,
      totalMetrics: metrics.length,
    });
  } catch (error) {
    console.error('Metrics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/metrics - Record custom metric
export const POST = asyncHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { name, type, value, labels, unit } = body;

  if (!name || !type || value === undefined) {
    return NextResponse.json(
      { error: 'Missing required fields: name, type, value' },
      { status: 400 }
    );
  }

  // Record the metric
  APMMonitor.recordMetric(name, type, value, labels, unit);

  // Also store in database for persistence
  try {
    await supabase.from('monitoring_metrics').insert({
      metric_name: name,
      metric_type: type,
      value,
      labels,
      unit,
    });
  } catch (error) {
    console.error('Failed to store metric in database:', error);
  }

  return NextResponse.json({
    success: true,
    message: 'Metric recorded successfully',
    metric: { name, type, value, labels, unit },
    timestamp: new Date().toISOString(),
  });
});

// Helper function to convert time window to milliseconds
function getIntervalMs(interval: string): number {
  const intervals: Record<string, number> = {
    '1 hour': 60 * 60 * 1000,
    '24 hours': 24 * 60 * 60 * 1000,
    '7 days': 7 * 24 * 60 * 60 * 1000,
    '30 days': 30 * 24 * 60 * 60 * 1000,
  };

  return intervals[interval] || intervals['1 hour'];
}

// Format metrics for Prometheus
function formatPrometheusMetrics(metrics: any[]): string {
  const metricGroups = new Map<string, any[]>();

  // Group metrics by name
  for (const metric of metrics) {
    const existing = metricGroups.get(metric.name) || [];
    existing.push(metric);
    metricGroups.set(metric.name, existing);
  }

  let output = '';

  for (const [name, metricList] of Array.from(metricGroups.entries())) {
    const latestMetric = metricList[0]; // Most recent

    // Add help and type comments
    output += `# HELP ${name} ${name} metric\n`;
    output += `# TYPE ${name} ${getPrometheusType(latestMetric.type)}\n`;

    // Add metric values
    for (const metric of metricList.slice(0, 10)) {
      // Last 10 values
      const labels = formatPrometheusLabels(metric.labels);
      const timestamp = Math.floor(metric.timestamp.getTime() / 1000);
      output += `${name}${labels} ${metric.value} ${timestamp}\n`;
    }

    output += '\n';
  }

  return output;
}

// Get Prometheus metric type
function getPrometheusType(type: string): string {
  switch (type) {
    case 'counter':
      return 'counter';
    case 'gauge':
      return 'gauge';
    case 'histogram':
      return 'histogram';
    case 'timer':
      return 'histogram';
    default:
      return 'gauge';
  }
}

// Format labels for Prometheus
function formatPrometheusLabels(labels?: Record<string, string>): string {
  if (!labels || Object.keys(labels).length === 0) {
    return '';
  }

  const labelPairs = Object.entries(labels)
    .map(([key, value]) => `${key}="${value}"`)
    .join(',');

  return `{${labelPairs}}`;
}
