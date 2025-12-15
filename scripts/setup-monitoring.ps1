# DEJA-VU Monitoring Setup Script for Windows
# This script sets up monitoring infrastructure and scheduled tasks

Write-Host "Setting up DEJA-VU monitoring infrastructure..." -ForegroundColor Green

# Create monitoring directories
$monitoringDirs = @(
    "logs\monitoring",
    "logs\alerts", 
    "logs\performance",
    "scripts\monitoring"
)

foreach ($dir in $monitoringDirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
        Write-Host "Created directory: $dir" -ForegroundColor Yellow
    }
}

# Create monitoring scripts
Write-Host "Creating monitoring scripts..." -ForegroundColor Green

# Health check script
$healthCheckScript = @'
# Health Check Script
$logFile = "logs\monitoring\health-check.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        "$timestamp - Health check passed" | Add-Content $logFile
    } else {
        "$timestamp - Health check failed with status: $($response.StatusCode)" | Add-Content $logFile
    }
} catch {
    "$timestamp - Health check error: $($_.Exception.Message)" | Add-Content $logFile
}
'@

$healthCheckScript | Out-File -FilePath "scripts\monitoring\health-check.ps1" -Encoding UTF8

# Critical alerts check script
$alertsCheckScript = @'
# Critical Alerts Check Script
$logFile = "logs\monitoring\alert-check.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

try {
    # Check for critical alerts via API
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/alerts?severity=critical&status=active" -Method GET
    
    if ($response.alerts -and $response.alerts.Count -gt 0) {
        $alertCount = $response.alerts.Count
        "$timestamp - $alertCount critical alerts detected" | Add-Content $logFile
        
        # Send notification if webhook is configured
        $webhookUrl = $env:ALERT_WEBHOOK_URL
        if ($webhookUrl) {
            $payload = @{
                text = "🚨 CRITICAL: $alertCount critical alerts detected in DEJA-VU system"
                timestamp = (Get-Date -Format "o")
            } | ConvertTo-Json
            
            Invoke-RestMethod -Uri $webhookUrl -Method POST -Body $payload -ContentType "application/json"
        }
    }
} catch {
    "$timestamp - Error checking alerts: $($_.Exception.Message)" | Add-Content $logFile
}
'@

$alertsCheckScript | Out-File -FilePath "scripts\monitoring\check-alerts.ps1" -Encoding UTF8

# System metrics collection script
$metricsScript = @'
# System Metrics Collection Script
$logFile = "logs\monitoring\metrics.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

try {
    # Get system performance counters
    $cpu = Get-Counter "\Processor(_Total)\% Processor Time" -SampleInterval 1 -MaxSamples 1
    $memory = Get-Counter "\Memory\Available MBytes" -SampleInterval 1 -MaxSamples 1
    $disk = Get-Counter "\PhysicalDisk(_Total)\% Disk Time" -SampleInterval 1 -MaxSamples 1
    
    $cpuUsage = [math]::Round($cpu.CounterSamples[0].CookedValue, 2)
    $availableMemoryMB = [math]::Round($memory.CounterSamples[0].CookedValue, 2)
    $diskUsage = [math]::Round($disk.CounterSamples[0].CookedValue, 2)
    
    # Get total memory
    $totalMemoryMB = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1MB
    $memoryUsagePercent = [math]::Round((($totalMemoryMB - $availableMemoryMB) / $totalMemoryMB) * 100, 2)
    
    # Send metrics to API
    $metrics = @(
        @{
            name = "system_cpu_usage_percent"
            type = "gauge"
            value = $cpuUsage
            unit = "%"
        },
        @{
            name = "system_memory_usage_percent"
            type = "gauge"
            value = $memoryUsagePercent
            unit = "%"
        },
        @{
            name = "system_disk_usage_percent"
            type = "gauge"
            value = $diskUsage
            unit = "%"
        }
    )
    
    foreach ($metric in $metrics) {
        $body = $metric | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:3000/api/metrics" -Method POST -Body $body -ContentType "application/json"
    }
    
    "$timestamp - System metrics collected: CPU=$cpuUsage%, Memory=$memoryUsagePercent%, Disk=$diskUsage%" | Add-Content $logFile
    
    # Check thresholds and alert
    if ($cpuUsage -gt 80 -or $memoryUsagePercent -gt 80 -or $diskUsage -gt 80) {
        $alertMessage = "⚠️ High system usage detected: CPU=$cpuUsage%, Memory=$memoryUsagePercent%, Disk=$diskUsage%"
        "$timestamp - $alertMessage" | Add-Content $logFile
        
        $webhookUrl = $env:ALERT_WEBHOOK_URL
        if ($webhookUrl) {
            $payload = @{
                text = $alertMessage
                timestamp = (Get-Date -Format "o")
            } | ConvertTo-Json
            
            Invoke-RestMethod -Uri $webhookUrl -Method POST -Body $payload -ContentType "application/json"
        }
    }
    
} catch {
    "$timestamp - Error collecting metrics: $($_.Exception.Message)" | Add-Content $logFile
}
'@

$metricsScript | Out-File -FilePath "scripts\monitoring\collect-metrics.ps1" -Encoding UTF8

# Database cleanup script
$cleanupScript = @'
# Database Cleanup Script
$logFile = "logs\monitoring\cleanup.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

try {
    # Database connection string from environment
    $connectionString = $env:DATABASE_URL
    
    if ($connectionString) {
        # Use psql if available, otherwise skip database cleanup
        $psqlPath = Get-Command psql -ErrorAction SilentlyContinue
        
        if ($psqlPath) {
            # Cleanup monitoring data
            $cleanupQuery = "SELECT cleanup_monitoring_data();"
            & psql $connectionString -c $cleanupQuery
            
            # Create daily aggregates
            $aggregateQuery = "SELECT create_daily_metric_aggregates();"
            & psql $connectionString -c $aggregateQuery
            
            # Cleanup old logs
            $logCleanupQuery = "SELECT cleanup_old_logs();"
            & psql $connectionString -c $logCleanupQuery
            
            "$timestamp - Database cleanup completed successfully" | Add-Content $logFile
        } else {
            "$timestamp - psql not found, skipping database cleanup" | Add-Content $logFile
        }
    } else {
        "$timestamp - DATABASE_URL not configured, skipping database cleanup" | Add-Content $logFile
    }
} catch {
    "$timestamp - Error during cleanup: $($_.Exception.Message)" | Add-Content $logFile
}
'@

$cleanupScript | Out-File -FilePath "scripts\monitoring\cleanup.ps1" -Encoding UTF8

# Weekly report script
$reportScript = @'
# Weekly Monitoring Report Script
$logFile = "logs\monitoring\reports.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$reportDate = Get-Date -Format "yyyyMMdd"
$reportFile = "logs\monitoring\weekly-report-$reportDate.txt"

try {
    "DEJA-VU Weekly Monitoring Report - $(Get-Date)" | Out-File $reportFile
    "================================================" | Add-Content $reportFile
    "" | Add-Content $reportFile
    
    # Get health data from API
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/health/detailed" -Method GET
    
    "System Health Summary:" | Add-Content $reportFile
    "Overall Status: $($healthResponse.status)" | Add-Content $reportFile
    "Uptime: $($healthResponse.uptime) seconds" | Add-Content $reportFile
    "" | Add-Content $reportFile
    
    "Services:" | Add-Content $reportFile
    foreach ($service in $healthResponse.services.PSObject.Properties) {
        "  $($service.Name): $($service.Value.status) - $($service.Value.message)" | Add-Content $reportFile
    }
    "" | Add-Content $reportFile
    
    # Get alerts data
    $alertsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/alerts?limit=50" -Method GET
    
    "Active Alerts Summary:" | Add-Content $reportFile
    if ($alertsResponse.alerts -and $alertsResponse.alerts.Count -gt 0) {
        foreach ($alert in $alertsResponse.alerts) {
            "  [$($alert.severity)] $($alert.metric_name): $($alert.current_value)" | Add-Content $reportFile
        }
    } else {
        "  No active alerts" | Add-Content $reportFile
    }
    "" | Add-Content $reportFile
    
    # Get metrics data
    $metricsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/metrics?timeWindow=7d" -Method GET
    
    "Performance Metrics Summary:" | Add-Content $reportFile
    "Total Metrics Collected: $($metricsResponse.totalMetrics)" | Add-Content $reportFile
    "" | Add-Content $reportFile
    
    "Report generated at $(Get-Date)" | Add-Content $reportFile
    
    "$timestamp - Weekly report generated: $reportFile" | Add-Content $logFile
    
    # Send report via email if configured
    $reportEmail = $env:REPORT_EMAIL
    if ($reportEmail) {
        # Note: Email sending would require additional configuration
        "$timestamp - Report email configured but not implemented in this script" | Add-Content $logFile
    }
    
} catch {
    "$timestamp - Error generating report: $($_.Exception.Message)" | Add-Content $logFile
}
'@

$reportScript | Out-File -FilePath "scripts\monitoring\weekly-report.ps1" -Encoding UTF8

# Make scripts executable
Write-Host "Setting execution policy for monitoring scripts..." -ForegroundColor Green
Get-ChildItem "scripts\monitoring\*.ps1" | ForEach-Object {
    Unblock-File $_.FullName
}

# Create scheduled tasks
Write-Host "Creating scheduled tasks..." -ForegroundColor Green

# Health check every 5 minutes
$healthCheckAction = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$(Get-Location)\scripts\monitoring\health-check.ps1`""
$healthCheckTrigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 5) -Once -At (Get-Date)
$healthCheckSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName "DEJA-VU Health Check" -Action $healthCheckAction -Trigger $healthCheckTrigger -Settings $healthCheckSettings -Force

# Critical alerts check every minute
$alertsAction = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$(Get-Location)\scripts\monitoring\check-alerts.ps1`""
$alertsTrigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 1) -Once -At (Get-Date)
Register-ScheduledTask -TaskName "DEJA-VU Critical Alerts Check" -Action $alertsAction -Trigger $alertsTrigger -Settings $healthCheckSettings -Force

# System metrics collection every 10 minutes
$metricsAction = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$(Get-Location)\scripts\monitoring\collect-metrics.ps1`""
$metricsTrigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 10) -Once -At (Get-Date)
Register-ScheduledTask -TaskName "DEJA-VU System Metrics" -Action $metricsAction -Trigger $metricsTrigger -Settings $healthCheckSettings -Force

# Database cleanup daily at 2 AM
$cleanupAction = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$(Get-Location)\scripts\monitoring\cleanup.ps1`""
$cleanupTrigger = New-ScheduledTaskTrigger -Daily -At "2:00 AM"
Register-ScheduledTask -TaskName "DEJA-VU Database Cleanup" -Action $cleanupAction -Trigger $cleanupTrigger -Settings $healthCheckSettings -Force

# Weekly report on Monday at 9 AM
$reportAction = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$(Get-Location)\scripts\monitoring\weekly-report.ps1`""
$reportTrigger = New-ScheduledTaskTrigger -Weekly -WeeksInterval 1 -DaysOfWeek Monday -At "9:00 AM"
Register-ScheduledTask -TaskName "DEJA-VU Weekly Report" -Action $reportAction -Trigger $reportTrigger -Settings $healthCheckSettings -Force

Write-Host "Monitoring setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure environment variables for alerts:"
Write-Host "   - ALERT_WEBHOOK_URL: Webhook URL for alert notifications"
Write-Host "   - ALERT_EMAIL: Email address for critical alerts"
Write-Host "   - REPORT_EMAIL: Email address for weekly reports"
Write-Host "   - DATABASE_URL: PostgreSQL connection string"
Write-Host ""
Write-Host "2. Check scheduled tasks:"
Write-Host "   Get-ScheduledTask | Where-Object {`$_.TaskName -like '*DEJA-VU*'}"
Write-Host ""
Write-Host "3. Check monitoring logs:"
Write-Host "   Get-Content logs\monitoring\*.log -Tail 20"
Write-Host ""
Write-Host "4. Access monitoring dashboard:"
Write-Host "   http://localhost:3000/admin/monitoring"
Write-Host ""
Write-Host "5. Test health check manually:"
Write-Host "   .\scripts\monitoring\health-check.ps1"