-- DEJA-VU Monitoring and Alerts Tables
-- This migration creates tables for monitoring metrics and alerts

-- Monitoring alerts table
CREATE TABLE monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(255) NOT NULL,
  current_value DECIMAL NOT NULL,
  threshold_value DECIMAL NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monitoring metrics table for historical data
CREATE TABLE monitoring_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(255) NOT NULL,
  metric_type VARCHAR(20) NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram', 'timer')),
  value DECIMAL NOT NULL,
  labels JSONB,
  unit VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System health status table
CREATE TABLE system_health_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  message TEXT,
  response_time INTEGER, -- in milliseconds
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance benchmarks table
CREATE TABLE performance_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_name VARCHAR(255) NOT NULL,
  duration_ms INTEGER NOT NULL,
  memory_usage_mb INTEGER,
  cpu_usage_percent DECIMAL(5,2),
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_monitoring_alerts_metric_name ON monitoring_alerts(metric_name);
CREATE INDEX idx_monitoring_alerts_severity ON monitoring_alerts(severity);
CREATE INDEX idx_monitoring_alerts_status ON monitoring_alerts(status);
CREATE INDEX idx_monitoring_alerts_created_at ON monitoring_alerts(created_at DESC);

CREATE INDEX idx_monitoring_metrics_name ON monitoring_metrics(metric_name);
CREATE INDEX idx_monitoring_metrics_type ON monitoring_metrics(metric_type);
CREATE INDEX idx_monitoring_metrics_created_at ON monitoring_metrics(created_at DESC);
CREATE INDEX idx_monitoring_metrics_name_created ON monitoring_metrics(metric_name, created_at DESC);

CREATE INDEX idx_system_health_service ON system_health_status(service_name);
CREATE INDEX idx_system_health_status ON system_health_status(status);
CREATE INDEX idx_system_health_created_at ON system_health_status(created_at DESC);

CREATE INDEX idx_performance_benchmarks_operation ON performance_benchmarks(operation_name);
CREATE INDEX idx_performance_benchmarks_created_at ON performance_benchmarks(created_at DESC);
CREATE INDEX idx_performance_benchmarks_success ON performance_benchmarks(success);

-- RLS policies (service role access only)
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage monitoring alerts" ON monitoring_alerts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage monitoring metrics" ON monitoring_metrics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage system health status" ON system_health_status
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage performance benchmarks" ON performance_benchmarks
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to get system health summary
CREATE OR REPLACE FUNCTION get_system_health_summary()
RETURNS TABLE (
  service_name VARCHAR(100),
  current_status VARCHAR(20),
  last_check TIMESTAMP WITH TIME ZONE,
  avg_response_time DECIMAL,
  status_changes_24h BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_status AS (
    SELECT DISTINCT ON (shs.service_name)
      shs.service_name,
      shs.status,
      shs.created_at,
      shs.response_time
    FROM system_health_status shs
    ORDER BY shs.service_name, shs.created_at DESC
  ),
  avg_response AS (
    SELECT 
      shs.service_name,
      AVG(shs.response_time) as avg_response_time
    FROM system_health_status shs
    WHERE shs.created_at > NOW() - INTERVAL '24 hours'
    GROUP BY shs.service_name
  ),
  status_changes AS (
    SELECT 
      shs.service_name,
      COUNT(*) as changes_24h
    FROM system_health_status shs
    WHERE shs.created_at > NOW() - INTERVAL '24 hours'
    GROUP BY shs.service_name
  )
  SELECT 
    ls.service_name,
    ls.status as current_status,
    ls.created_at as last_check,
    ar.avg_response_time,
    COALESCE(sc.changes_24h, 0) as status_changes_24h
  FROM latest_status ls
  LEFT JOIN avg_response ar ON ls.service_name = ar.service_name
  LEFT JOIN status_changes sc ON ls.service_name = sc.service_name
  ORDER BY ls.service_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get performance metrics summary
CREATE OR REPLACE FUNCTION get_performance_metrics_summary(
  time_window INTERVAL DEFAULT INTERVAL '1 hour'
)
RETURNS TABLE (
  metric_name VARCHAR(255),
  metric_type VARCHAR(20),
  current_value DECIMAL,
  avg_value DECIMAL,
  min_value DECIMAL,
  max_value DECIMAL,
  sample_count BIGINT,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_metrics AS (
    SELECT DISTINCT ON (mm.metric_name)
      mm.metric_name,
      mm.metric_type,
      mm.value,
      mm.created_at
    FROM monitoring_metrics mm
    WHERE mm.created_at > NOW() - time_window
    ORDER BY mm.metric_name, mm.created_at DESC
  ),
  metric_stats AS (
    SELECT 
      mm.metric_name,
      mm.metric_type,
      AVG(mm.value) as avg_value,
      MIN(mm.value) as min_value,
      MAX(mm.value) as max_value,
      COUNT(*) as sample_count
    FROM monitoring_metrics mm
    WHERE mm.created_at > NOW() - time_window
    GROUP BY mm.metric_name, mm.metric_type
  )
  SELECT 
    lm.metric_name,
    lm.metric_type,
    lm.value as current_value,
    ms.avg_value,
    ms.min_value,
    ms.max_value,
    ms.sample_count,
    lm.created_at as last_updated
  FROM latest_metrics lm
  JOIN metric_stats ms ON lm.metric_name = ms.metric_name
  ORDER BY lm.metric_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get active alerts summary
CREATE OR REPLACE FUNCTION get_active_alerts_summary()
RETURNS TABLE (
  severity VARCHAR(20),
  alert_count BIGINT,
  oldest_alert TIMESTAMP WITH TIME ZONE,
  newest_alert TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ma.severity,
    COUNT(*) as alert_count,
    MIN(ma.created_at) as oldest_alert,
    MAX(ma.created_at) as newest_alert
  FROM monitoring_alerts ma
  WHERE ma.status = 'active'
  GROUP BY ma.severity
  ORDER BY 
    CASE ma.severity
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old monitoring data
CREATE OR REPLACE FUNCTION cleanup_monitoring_data()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete old resolved alerts (older than 30 days)
  DELETE FROM monitoring_alerts
  WHERE status = 'resolved' 
  AND resolved_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete old metrics (older than 7 days, keep daily aggregates)
  DELETE FROM monitoring_metrics
  WHERE created_at < NOW() - INTERVAL '7 days'
  AND metric_type != 'daily_aggregate';
  
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  -- Delete old health status records (older than 7 days)
  DELETE FROM system_health_status
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  -- Delete old performance benchmarks (older than 30 days)
  DELETE FROM performance_benchmarks
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create daily metric aggregates
CREATE OR REPLACE FUNCTION create_daily_metric_aggregates()
RETURNS INTEGER AS $$
DECLARE
  processed_count INTEGER := 0;
BEGIN
  -- Create daily aggregates for counter metrics
  INSERT INTO monitoring_metrics (
    metric_name,
    metric_type,
    value,
    labels,
    unit,
    created_at
  )
  SELECT 
    mm.metric_name,
    'daily_aggregate'::VARCHAR(20),
    SUM(mm.value) as total_value,
    jsonb_build_object(
      'aggregation_type', 'sum',
      'original_type', 'counter',
      'sample_count', COUNT(*)
    ) as labels,
    mm.unit,
    DATE_TRUNC('day', NOW()) as created_at
  FROM monitoring_metrics mm
  WHERE mm.metric_type = 'counter'
  AND mm.created_at >= DATE_TRUNC('day', NOW() - INTERVAL '1 day')
  AND mm.created_at < DATE_TRUNC('day', NOW())
  AND NOT EXISTS (
    SELECT 1 FROM monitoring_metrics agg
    WHERE agg.metric_name = mm.metric_name
    AND agg.metric_type = 'daily_aggregate'
    AND agg.created_at = DATE_TRUNC('day', NOW() - INTERVAL '1 day')
  )
  GROUP BY mm.metric_name, mm.unit;
  
  GET DIAGNOSTICS processed_count = ROW_COUNT;
  
  -- Create daily aggregates for gauge metrics (average)
  INSERT INTO monitoring_metrics (
    metric_name,
    metric_type,
    value,
    labels,
    unit,
    created_at
  )
  SELECT 
    mm.metric_name,
    'daily_aggregate'::VARCHAR(20),
    AVG(mm.value) as avg_value,
    jsonb_build_object(
      'aggregation_type', 'avg',
      'original_type', 'gauge',
      'sample_count', COUNT(*),
      'min_value', MIN(mm.value),
      'max_value', MAX(mm.value)
    ) as labels,
    mm.unit,
    DATE_TRUNC('day', NOW()) as created_at
  FROM monitoring_metrics mm
  WHERE mm.metric_type = 'gauge'
  AND mm.created_at >= DATE_TRUNC('day', NOW() - INTERVAL '1 day')
  AND mm.created_at < DATE_TRUNC('day', NOW())
  AND NOT EXISTS (
    SELECT 1 FROM monitoring_metrics agg
    WHERE agg.metric_name = mm.metric_name
    AND agg.metric_type = 'daily_aggregate'
    AND agg.created_at = DATE_TRUNC('day', NOW() - INTERVAL '1 day')
  )
  GROUP BY mm.metric_name, mm.unit;
  
  GET DIAGNOSTICS processed_count = processed_count + ROW_COUNT;
  
  RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update monitoring_alerts updated_at
CREATE OR REPLACE FUNCTION update_monitoring_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_monitoring_alerts_updated_at
  BEFORE UPDATE ON monitoring_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_monitoring_alerts_updated_at();