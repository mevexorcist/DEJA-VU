#!/bin/bash

# DEJA-VU Monitoring Setup Script
# This script sets up monitoring infrastructure and cron jobs

echo "Setting up DEJA-VU monitoring infrastructure..."

# Create monitoring directories
mkdir -p logs/monitoring
mkdir -p logs/alerts
mkdir -p logs/performance

# Set up log rotation for monitoring logs
cat > /etc/logrotate.d/deja-vu-monitoring << EOF
/var/log/deja-vu/monitoring/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
EOF

# Set up cron jobs for monitoring tasks
echo "Setting up monitoring cron jobs..."

# Create monitoring cron file
cat > /tmp/monitoring-cron << EOF
# DEJA-VU Monitoring Cron Jobs

# Run health checks every 5 minutes
*/5 * * * * curl -f http://localhost:3000/api/health > /dev/null 2>&1 || echo "Health check failed at \$(date)" >> /var/log/deja-vu/monitoring/health-check.log

# Cleanup old monitoring data daily at 2 AM
0 2 * * * psql \$DATABASE_URL -c "SELECT cleanup_monitoring_data();" >> /var/log/deja-vu/monitoring/cleanup.log 2>&1

# Create daily metric aggregates at 1 AM
0 1 * * * psql \$DATABASE_URL -c "SELECT create_daily_metric_aggregates();" >> /var/log/deja-vu/monitoring/aggregates.log 2>&1

# Cleanup old logs weekly on Sunday at 3 AM
0 3 * * 0 psql \$DATABASE_URL -c "SELECT cleanup_old_logs();" >> /var/log/deja-vu/monitoring/log-cleanup.log 2>&1

# Cleanup rate limit violations daily at 4 AM
0 4 * * * psql \$DATABASE_URL -c "SELECT cleanup_rate_limit_violations();" >> /var/log/deja-vu/monitoring/rate-limit-cleanup.log 2>&1

# Generate monitoring report weekly on Monday at 9 AM
0 9 * * 1 /opt/deja-vu/scripts/generate-monitoring-report.sh >> /var/log/deja-vu/monitoring/reports.log 2>&1

# Check for critical alerts every minute
* * * * * /opt/deja-vu/scripts/check-critical-alerts.sh >> /var/log/deja-vu/monitoring/alert-check.log 2>&1

# Monitor disk space every 15 minutes
*/15 * * * * /opt/deja-vu/scripts/check-disk-space.sh >> /var/log/deja-vu/monitoring/disk-space.log 2>&1

# Monitor memory usage every 10 minutes
*/10 * * * * /opt/deja-vu/scripts/check-memory-usage.sh >> /var/log/deja-vu/monitoring/memory.log 2>&1

# Backup monitoring data weekly on Saturday at 11 PM
0 23 * * 6 /opt/deja-vu/scripts/backup-monitoring-data.sh >> /var/log/deja-vu/monitoring/backup.log 2>&1
EOF

# Install cron jobs
crontab /tmp/monitoring-cron
rm /tmp/monitoring-cron

echo "Monitoring cron jobs installed successfully"

# Create monitoring scripts directory
mkdir -p /opt/deja-vu/scripts

# Create critical alerts check script
cat > /opt/deja-vu/scripts/check-critical-alerts.sh << 'EOF'
#!/bin/bash

# Check for critical alerts and send notifications

ALERT_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM monitoring_alerts WHERE status = 'active' AND severity = 'critical';")

if [ "$ALERT_COUNT" -gt 0 ]; then
    echo "$(date): $ALERT_COUNT critical alerts detected"
    
    # Send notification if webhook is configured
    if [ ! -z "$ALERT_WEBHOOK_URL" ]; then
        curl -X POST "$ALERT_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"🚨 CRITICAL: $ALERT_COUNT critical alerts detected in DEJA-VU system\",\"timestamp\":\"$(date -Iseconds)\"}"
    fi
    
    # Send email if configured
    if [ ! -z "$ALERT_EMAIL" ]; then
        echo "Critical alerts detected: $ALERT_COUNT" | mail -s "DEJA-VU Critical Alerts" "$ALERT_EMAIL"
    fi
fi
EOF

# Create disk space check script
cat > /opt/deja-vu/scripts/check-disk-space.sh << 'EOF'
#!/bin/bash

# Check disk space and alert if usage is high

THRESHOLD=80
USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$USAGE" -gt "$THRESHOLD" ]; then
    echo "$(date): Disk usage is ${USAGE}% (threshold: ${THRESHOLD}%)"
    
    # Record metric
    curl -X POST "http://localhost:3000/api/metrics" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"disk_usage_percent\",\"type\":\"gauge\",\"value\":$USAGE,\"unit\":\"%\"}" \
        > /dev/null 2>&1
    
    # Send alert if webhook is configured
    if [ ! -z "$ALERT_WEBHOOK_URL" ]; then
        curl -X POST "$ALERT_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"⚠️ High disk usage: ${USAGE}% on DEJA-VU server\",\"timestamp\":\"$(date -Iseconds)\"}"
    fi
fi
EOF

# Create memory usage check script
cat > /opt/deja-vu/scripts/check-memory-usage.sh << 'EOF'
#!/bin/bash

# Check memory usage and alert if usage is high

THRESHOLD=80
USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')

if [ "$USAGE" -gt "$THRESHOLD" ]; then
    echo "$(date): Memory usage is ${USAGE}% (threshold: ${THRESHOLD}%)"
    
    # Record metric
    curl -X POST "http://localhost:3000/api/metrics" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"system_memory_usage_percent\",\"type\":\"gauge\",\"value\":$USAGE,\"unit\":\"%\"}" \
        > /dev/null 2>&1
    
    # Send alert if webhook is configured
    if [ ! -z "$ALERT_WEBHOOK_URL" ]; then
        curl -X POST "$ALERT_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"⚠️ High memory usage: ${USAGE}% on DEJA-VU server\",\"timestamp\":\"$(date -Iseconds)\"}"
    fi
fi
EOF

# Create monitoring report script
cat > /opt/deja-vu/scripts/generate-monitoring-report.sh << 'EOF'
#!/bin/bash

# Generate weekly monitoring report

REPORT_FILE="/var/log/deja-vu/monitoring/weekly-report-$(date +%Y%m%d).txt"

echo "DEJA-VU Weekly Monitoring Report - $(date)" > "$REPORT_FILE"
echo "================================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# System health summary
echo "System Health Summary:" >> "$REPORT_FILE"
psql $DATABASE_URL -c "SELECT * FROM get_system_health_summary();" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Active alerts summary
echo "Active Alerts Summary:" >> "$REPORT_FILE"
psql $DATABASE_URL -c "SELECT * FROM get_active_alerts_summary();" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Performance metrics summary
echo "Performance Metrics Summary (Last 7 days):" >> "$REPORT_FILE"
psql $DATABASE_URL -c "SELECT * FROM get_performance_metrics_summary('7 days');" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Top errors
echo "Top Errors (Last 7 days):" >> "$REPORT_FILE"
psql $DATABASE_URL -c "
SELECT 
    error_details->>'name' as error_name,
    COUNT(*) as count,
    MAX(created_at) as last_occurrence
FROM application_logs 
WHERE level IN ('error', 'fatal') 
AND created_at > NOW() - INTERVAL '7 days'
GROUP BY error_details->>'name'
ORDER BY count DESC
LIMIT 10;
" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "Report generated at $(date)" >> "$REPORT_FILE"

# Send report if email is configured
if [ ! -z "$REPORT_EMAIL" ]; then
    mail -s "DEJA-VU Weekly Monitoring Report" "$REPORT_EMAIL" < "$REPORT_FILE"
fi
EOF

# Create backup script
cat > /opt/deja-vu/scripts/backup-monitoring-data.sh << 'EOF'
#!/bin/bash

# Backup monitoring data

BACKUP_DIR="/var/backups/deja-vu/monitoring"
DATE=$(date +%Y%m%d)

mkdir -p "$BACKUP_DIR"

# Backup monitoring tables
pg_dump $DATABASE_URL \
    --table=monitoring_alerts \
    --table=monitoring_metrics \
    --table=system_health_status \
    --table=performance_benchmarks \
    --table=application_logs \
    --table=security_logs \
    --data-only \
    --compress=9 \
    > "$BACKUP_DIR/monitoring-data-$DATE.sql.gz"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "monitoring-data-*.sql.gz" -mtime +30 -delete

echo "$(date): Monitoring data backup completed"
EOF

# Make scripts executable
chmod +x /opt/deja-vu/scripts/*.sh

echo "Monitoring scripts created and made executable"

# Create systemd service for monitoring (optional)
cat > /etc/systemd/system/deja-vu-monitoring.service << EOF
[Unit]
Description=DEJA-VU Monitoring Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/deja-vu
ExecStart=/usr/bin/node monitoring-daemon.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Create monitoring daemon (optional)
cat > /opt/deja-vu/monitoring-daemon.js << 'EOF'
// Simple monitoring daemon for DEJA-VU
const http = require('http');
const fs = require('fs');

const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const LOG_FILE = '/var/log/deja-vu/monitoring/daemon.log';

function log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - ${message}\n`;
    console.log(logEntry.trim());
    fs.appendFileSync(LOG_FILE, logEntry);
}

function checkHealth() {
    const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/health',
        method: 'GET',
        timeout: 5000,
    }, (res) => {
        if (res.statusCode === 200) {
            log('Health check passed');
        } else {
            log(`Health check failed with status: ${res.statusCode}`);
        }
    });

    req.on('error', (error) => {
        log(`Health check error: ${error.message}`);
    });

    req.on('timeout', () => {
        log('Health check timeout');
        req.destroy();
    });

    req.end();
}

// Start monitoring
log('DEJA-VU monitoring daemon started');
setInterval(checkHealth, HEALTH_CHECK_INTERVAL);

// Graceful shutdown
process.on('SIGTERM', () => {
    log('DEJA-VU monitoring daemon stopping');
    process.exit(0);
});

process.on('SIGINT', () => {
    log('DEJA-VU monitoring daemon stopping');
    process.exit(0);
});
EOF

echo "Monitoring setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure environment variables for alerts:"
echo "   - ALERT_WEBHOOK_URL: Webhook URL for alert notifications"
echo "   - ALERT_EMAIL: Email address for critical alerts"
echo "   - REPORT_EMAIL: Email address for weekly reports"
echo ""
echo "2. Enable and start the monitoring service (optional):"
echo "   sudo systemctl enable deja-vu-monitoring"
echo "   sudo systemctl start deja-vu-monitoring"
echo ""
echo "3. Check monitoring logs:"
echo "   tail -f /var/log/deja-vu/monitoring/*.log"
echo ""
echo "4. Access monitoring dashboard:"
echo "   http://your-domain/admin/monitoring"