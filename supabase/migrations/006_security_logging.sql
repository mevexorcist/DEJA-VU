-- DEJA-VU Security and Application Logging Tables
-- This migration creates tables for security events and application logs

-- Security logs table for tracking security events
CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application logs table for general application logging
CREATE TABLE application_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level VARCHAR(10) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  message TEXT NOT NULL,
  metadata JSONB,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  request_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  url TEXT,
  method VARCHAR(10),
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at DESC);
CREATE INDEX idx_security_logs_severity ON security_logs(severity);
CREATE INDEX idx_security_logs_ip ON security_logs(ip_address);

CREATE INDEX idx_application_logs_level ON application_logs(level);
CREATE INDEX idx_application_logs_user_id ON application_logs(user_id);
CREATE INDEX idx_application_logs_created_at ON application_logs(created_at DESC);
CREATE INDEX idx_application_logs_request_id ON application_logs(request_id);

-- RLS policies for security logs (admin access only)
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access logs (no user access)
CREATE POLICY "Service role can manage security logs" ON security_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage application logs" ON application_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to clean up old logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS INTEGER AS $
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete security logs older than 1 year
  DELETE FROM security_logs 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete application logs older than 3 months (except errors)
  DELETE FROM application_logs 
  WHERE created_at < NOW() - INTERVAL '3 months'
  AND level NOT IN ('error', 'fatal');
  
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  -- Delete error logs older than 1 year
  DELETE FROM application_logs 
  WHERE created_at < NOW() - INTERVAL '1 year'
  AND level IN ('error', 'fatal');
  
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  RETURN deleted_count;
END;
$ LANGUAGE plpgsql;

-- Function to get security event statistics
CREATE OR REPLACE FUNCTION get_security_stats(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '24 hours',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  event_type VARCHAR(50),
  severity VARCHAR(20),
  count BIGINT,
  unique_users BIGINT,
  unique_ips BIGINT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    sl.event_type,
    sl.severity,
    COUNT(*) as count,
    COUNT(DISTINCT sl.user_id) as unique_users,
    COUNT(DISTINCT sl.ip_address) as unique_ips
  FROM security_logs sl
  WHERE sl.created_at BETWEEN start_date AND end_date
  GROUP BY sl.event_type, sl.severity
  ORDER BY count DESC;
END;
$ LANGUAGE plpgsql;

-- Function to detect suspicious activity patterns
CREATE OR REPLACE FUNCTION detect_suspicious_activity(
  time_window INTERVAL DEFAULT INTERVAL '1 hour',
  threshold INTEGER DEFAULT 10
)
RETURNS TABLE (
  ip_address INET,
  event_count BIGINT,
  event_types TEXT[],
  first_event TIMESTAMP WITH TIME ZONE,
  last_event TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    sl.ip_address,
    COUNT(*) as event_count,
    ARRAY_AGG(DISTINCT sl.event_type) as event_types,
    MIN(sl.created_at) as first_event,
    MAX(sl.created_at) as last_event
  FROM security_logs sl
  WHERE sl.created_at > NOW() - time_window
  AND sl.severity IN ('high', 'critical')
  GROUP BY sl.ip_address
  HAVING COUNT(*) >= threshold
  ORDER BY event_count DESC;
END;
$ LANGUAGE plpgsql;

-- Rate limiting tracking table
CREATE TABLE rate_limit_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  violation_count INTEGER DEFAULT 1,
  first_violation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_violation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_blocked BOOLEAN DEFAULT FALSE,
  block_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for rate limiting
CREATE UNIQUE INDEX idx_rate_limit_ip_endpoint ON rate_limit_violations(ip_address, endpoint);
CREATE INDEX idx_rate_limit_user_id ON rate_limit_violations(user_id);
CREATE INDEX idx_rate_limit_blocked ON rate_limit_violations(is_blocked, block_expires_at);

-- RLS for rate limiting table
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage rate limit violations" ON rate_limit_violations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to record rate limit violation
CREATE OR REPLACE FUNCTION record_rate_limit_violation(
  p_ip_address INET,
  p_endpoint VARCHAR(255),
  p_user_id UUID DEFAULT NULL
)
RETURNS VOID AS $
BEGIN
  INSERT INTO rate_limit_violations (ip_address, endpoint, user_id)
  VALUES (p_ip_address, p_endpoint, p_user_id)
  ON CONFLICT (ip_address, endpoint)
  DO UPDATE SET
    violation_count = rate_limit_violations.violation_count + 1,
    last_violation = NOW(),
    updated_at = NOW();
    
  -- Auto-block after 5 violations within 1 hour
  UPDATE rate_limit_violations
  SET 
    is_blocked = TRUE,
    block_expires_at = NOW() + INTERVAL '1 hour'
  WHERE ip_address = p_ip_address 
  AND endpoint = p_endpoint
  AND violation_count >= 5
  AND last_violation > NOW() - INTERVAL '1 hour'
  AND NOT is_blocked;
END;
$ LANGUAGE plpgsql;

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION is_ip_blocked(
  p_ip_address INET,
  p_endpoint VARCHAR(255)
)
RETURNS BOOLEAN AS $
DECLARE
  blocked BOOLEAN := FALSE;
BEGIN
  SELECT is_blocked INTO blocked
  FROM rate_limit_violations
  WHERE ip_address = p_ip_address
  AND endpoint = p_endpoint
  AND is_blocked = TRUE
  AND (block_expires_at IS NULL OR block_expires_at > NOW());
  
  RETURN COALESCE(blocked, FALSE);
END;
$ LANGUAGE plpgsql;

-- Cleanup function for rate limit violations
CREATE OR REPLACE FUNCTION cleanup_rate_limit_violations()
RETURNS INTEGER AS $
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Remove expired blocks
  UPDATE rate_limit_violations
  SET is_blocked = FALSE, block_expires_at = NULL
  WHERE is_blocked = TRUE 
  AND block_expires_at IS NOT NULL 
  AND block_expires_at < NOW();
  
  -- Delete old violation records (older than 7 days)
  DELETE FROM rate_limit_violations
  WHERE created_at < NOW() - INTERVAL '7 days'
  AND NOT is_blocked;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$ LANGUAGE plpgsql;