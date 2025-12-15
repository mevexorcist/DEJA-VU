// Detailed health check API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { APMMonitor } from '@/lib/monitoring';
import { asyncHandler } from '@/lib/error-handler';
import { supabase } from '@/lib/supabase';

// GET /api/health/detailed - Detailed health information
export const GET = asyncHandler(async (req: NextRequest) => {
  // Get health status
  const health = APMMonitor.getOverallHealth();

  // Get recent metrics
  const metrics = APMMonitor.getMetrics();
  const recentMetrics = metrics.slice(0, 100); // Last 100 metrics

  // Get system health summary from database
  let systemHealthSummary = null;
  try {
    const { data } = await supabase.rpc('get_system_health_summary');
    systemHealthSummary = data;
  } catch (error) {
    console.error('Failed to get system health summary:', error);
  }

  // Get performance metrics summary
  let performanceMetrics = null;
  try {
    const { data } = await supabase.rpc('get_performance_metrics_summary');
    performanceMetrics = data;
  } catch (error) {
    console.error('Failed to get performance metrics:', error);
  }

  // Get active alerts
  let activeAlerts = null;
  try {
    const { data } = await supabase.rpc('get_active_alerts_summary');
    activeAlerts = data;
  } catch (error) {
    console.error('Failed to get active alerts:', error);
  }

  // Calculate uptime
  const uptime =
    typeof process !== 'undefined' && process.uptime
      ? Math.floor(process.uptime())
      : null;

  // Get memory usage
  let memoryUsage = null;
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    memoryUsage = {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024), // MB
    };
  }

  const statusCode =
    health.status === 'healthy'
      ? 200
      : health.status === 'degraded'
        ? 200
        : 503;

  return NextResponse.json(
    {
      status: health.status,
      timestamp: new Date().toISOString(),
      uptime,
      memoryUsage,
      services: health.services,
      summary: health.summary,
      recentMetrics,
      systemHealthSummary,
      performanceMetrics,
      activeAlerts,
      environment: {
        nodeVersion: typeof process !== 'undefined' ? process.version : null,
        platform: typeof process !== 'undefined' ? process.platform : null,
        nodeEnv: process.env.NODE_ENV,
      },
    },
    { status: statusCode }
  );
});
