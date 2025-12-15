// Alerts API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { asyncHandler } from '@/lib/error-handler';
import { supabase } from '@/lib/supabase';

// GET /api/alerts - Get monitoring alerts
export const GET = asyncHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'active';
  const severity = url.searchParams.get('severity');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  let query = supabase
    .from('monitoring_alerts')
    .select(
      `
      *,
      acknowledged_by:users(username, display_name)
    `
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Filter by status
  if (status !== 'all') {
    query = query.eq('status', status);
  }

  // Filter by severity
  if (severity) {
    query = query.eq('severity', severity);
  }

  const { data: alerts, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch alerts', details: error.message },
      { status: 500 }
    );
  }

  // Get alert summary
  const { data: summary } = await supabase.rpc('get_active_alerts_summary');

  return NextResponse.json({
    alerts,
    summary,
    pagination: {
      limit,
      offset,
      total: alerts?.length || 0,
    },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/alerts - Create manual alert
export const POST = asyncHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { metricName, currentValue, thresholdValue, severity, message } = body;

  if (!metricName || currentValue === undefined || !severity) {
    return NextResponse.json(
      { error: 'Missing required fields: metricName, currentValue, severity' },
      { status: 400 }
    );
  }

  const { data: alert, error } = await supabase
    .from('monitoring_alerts')
    .insert({
      metric_name: metricName,
      current_value: currentValue,
      threshold_value: thresholdValue || currentValue,
      severity,
      metadata: {
        manual: true,
        message,
        created_by: 'api',
      },
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create alert', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      alert,
      message: 'Alert created successfully',
    },
    { status: 201 }
  );
});

// PATCH /api/alerts/:id - Update alert status
export const PATCH = asyncHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const alertId = url.pathname.split('/').pop();
  const body = await req.json();
  const { status, acknowledgedBy } = body;

  if (!alertId) {
    return NextResponse.json(
      { error: 'Alert ID is required' },
      { status: 400 }
    );
  }

  const updateData: any = { status };

  if (status === 'acknowledged' && acknowledgedBy) {
    updateData.acknowledged_by = acknowledgedBy;
    updateData.acknowledged_at = new Date().toISOString();
  }

  if (status === 'resolved') {
    updateData.resolved_at = new Date().toISOString();
  }

  const { data: alert, error } = await supabase
    .from('monitoring_alerts')
    .update(updateData)
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to update alert', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    alert,
    message: 'Alert updated successfully',
  });
});
