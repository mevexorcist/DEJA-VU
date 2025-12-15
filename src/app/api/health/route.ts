// Health check API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { APMMonitor } from '@/lib/monitoring';
import { asyncHandler } from '@/lib/error-handler';

// GET /api/health - Basic health check
export const GET = asyncHandler(async (req: NextRequest) => {
  const health = APMMonitor.getOverallHealth();

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
      services: health.services,
      summary: health.summary,
    },
    { status: statusCode }
  );
});

// POST /api/health/check - Force health check
export const POST = asyncHandler(async (req: NextRequest) => {
  // Run all health checks
  await APMMonitor.runAllHealthChecks();

  const health = APMMonitor.getOverallHealth();

  return NextResponse.json({
    status: health.status,
    timestamp: new Date().toISOString(),
    services: health.services,
    summary: health.summary,
    message: 'Health checks completed',
  });
});
