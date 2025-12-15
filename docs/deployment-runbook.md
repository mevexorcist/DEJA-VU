# DEJA-VU Production Deployment Runbook

## Overview

This runbook provides step-by-step instructions for deploying DEJA-VU to production environments. The application is containerized using Docker and includes all necessary services.

## Prerequisites

### System Requirements
- Docker Engine 20.10+
- Docker Compose 2.0+
- Minimum 4GB RAM
- Minimum 20GB disk space
- SSL certificates for HTTPS

### Required Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database Configuration
DB_USER=dejavu_user
DB_PASSWORD=secure_password_here

# Security
JWT_SECRET=your_jwt_secret_minimum_32_characters
ENCRYPTION_KEY=your_encryption_key_32_characters

# Optional: External API Keys
EXCHANGE_API_KEYS=your_exchange_api_keys
BLOCKCHAIN_RPC_URLS=your_rpc_urls
```

## Pre-Deployment Checklist

### ✅ Infrastructure Setup
- [ ] Server provisioned with adequate resources
- [ ] Docker and Docker Compose installed
- [ ] SSL certificates obtained and placed in `deployment/ssl/`
- [ ] Domain name configured and DNS pointing to server
- [ ] Firewall configured (ports 80, 443 open)

### ✅ Configuration Verification
- [ ] Environment variables set in `.env.production`
- [ ] Supabase project configured and accessible
- [ ] Database migrations tested
- [ ] SSL certificates valid and properly formatted

### ✅ Code Preparation
- [ ] Latest code pulled from main branch
- [ ] All tests passing (minimum 90% pass rate acceptable)
- [ ] Build process verified locally
- [ ] Security scan completed

## Deployment Steps

### Step 1: Environment Setup

```bash
# Clone repository
git clone https://github.com/your-org/deja-vu.git
cd deja-vu

# Set up environment
cp .env.example .env.production
# Edit .env.production with your values

# Make deployment script executable
chmod +x deployment/deploy.sh
```

### Step 2: SSL Certificate Setup

```bash
# Place your SSL certificates in the deployment/ssl directory
mkdir -p deployment/ssl
cp your-cert.pem deployment/ssl/cert.pem
cp your-key.pem deployment/ssl/key.pem

# Verify certificate validity
openssl x509 -in deployment/ssl/cert.pem -text -noout
```

### Step 3: Database Preparation

```bash
# Verify Supabase connection
curl -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     "$SUPABASE_URL/rest/v1/"

# Test database connectivity
docker run --rm postgres:15-alpine \
  psql -h your-db-host -U $DB_USER -d dejavu_prod -c "SELECT 1;"
```

### Step 4: Execute Deployment

```bash
# Load environment variables
source .env.production

# Run deployment script
./deployment/deploy.sh
```

### Step 5: Post-Deployment Verification

```bash
# Check service status
docker-compose -f deployment/production.yml ps

# Verify health endpoints
curl -f https://your-domain.com/health
curl -f https://your-domain.com/api/health/detailed

# Check application logs
docker-compose -f deployment/production.yml logs -f deja-vu-app
```

## Service Management

### Starting Services
```bash
docker-compose -f deployment/production.yml up -d
```

### Stopping Services
```bash
docker-compose -f deployment/production.yml down
```

### Restarting Application Only
```bash
docker-compose -f deployment/production.yml restart deja-vu-app
```

### Viewing Logs
```bash
# All services
docker-compose -f deployment/production.yml logs -f

# Specific service
docker-compose -f deployment/production.yml logs -f deja-vu-app
```

### Scaling Services
```bash
# Scale application instances
docker-compose -f deployment/production.yml up -d --scale deja-vu-app=3
```

## Monitoring and Maintenance

### Health Checks

The application provides several health check endpoints:

- **Basic Health**: `GET /health`
- **Detailed Health**: `GET /api/health/detailed`
- **Metrics**: `GET /api/metrics`

### Log Monitoring

```bash
# Monitor application logs
docker-compose -f deployment/production.yml logs -f deja-vu-app

# Monitor database logs
docker-compose -f deployment/production.yml logs -f postgres

# Monitor nginx logs
docker-compose -f deployment/production.yml logs -f nginx
```

### Performance Monitoring

```bash
# Check resource usage
docker stats

# Monitor database performance
docker-compose -f deployment/production.yml exec postgres \
  psql -U $DB_USER -d dejavu_prod -c "SELECT * FROM pg_stat_activity;"
```

## Backup and Recovery

### Database Backup

```bash
# Create database backup
docker-compose -f deployment/production.yml exec postgres \
  pg_dump -U $DB_USER dejavu_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker-compose -f deployment/production.yml exec postgres \
  pg_dump -U $DB_USER dejavu_prod > $BACKUP_DIR/dejavu_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "dejavu_backup_*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh
```

### Database Restore

```bash
# Restore from backup
docker-compose -f deployment/production.yml exec postgres \
  psql -U $DB_USER -d dejavu_prod < backup_file.sql
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
docker-compose -f deployment/production.yml logs deja-vu-app

# Common causes:
# - Missing environment variables
# - Database connection issues
# - Port conflicts
```

#### Database Connection Issues
```bash
# Check database status
docker-compose -f deployment/production.yml ps postgres

# Test connection
docker-compose -f deployment/production.yml exec postgres \
  psql -U $DB_USER -d dejavu_prod -c "SELECT 1;"
```

#### SSL Certificate Issues
```bash
# Verify certificate
openssl x509 -in deployment/ssl/cert.pem -text -noout

# Check nginx configuration
docker-compose -f deployment/production.yml exec nginx nginx -t
```

#### High Memory Usage
```bash
# Check memory usage
docker stats

# Restart services if needed
docker-compose -f deployment/production.yml restart
```

### Performance Issues

#### Slow Database Queries
```bash
# Enable query logging
docker-compose -f deployment/production.yml exec postgres \
  psql -U $DB_USER -d dejavu_prod -c "ALTER SYSTEM SET log_statement = 'all';"

# Check slow queries
docker-compose -f deployment/production.yml logs postgres | grep "duration:"
```

#### High CPU Usage
```bash
# Check process usage
docker-compose -f deployment/production.yml exec deja-vu-app top

# Scale application if needed
docker-compose -f deployment/production.yml up -d --scale deja-vu-app=2
```

## Security Considerations

### Regular Security Tasks

1. **Update Dependencies**
   ```bash
   npm audit
   npm update
   ```

2. **Monitor Logs for Suspicious Activity**
   ```bash
   # Check for failed authentication attempts
   docker-compose -f deployment/production.yml logs | grep "authentication failed"
   
   # Monitor rate limiting
   docker-compose -f deployment/production.yml logs nginx | grep "limiting requests"
   ```

3. **SSL Certificate Renewal**
   ```bash
   # Check certificate expiration
   openssl x509 -in deployment/ssl/cert.pem -noout -dates
   ```

### Security Incident Response

1. **Suspected Breach**
   - Immediately rotate all API keys and secrets
   - Check logs for unauthorized access
   - Scale down to single instance for investigation

2. **DDoS Attack**
   - Monitor nginx rate limiting logs
   - Implement additional rate limiting if needed
   - Consider using a CDN/DDoS protection service

## Rollback Procedures

### Quick Rollback
```bash
# Stop current deployment
docker-compose -f deployment/production.yml down

# Checkout previous version
git checkout previous-stable-tag

# Redeploy
./deployment/deploy.sh
```

### Database Rollback
```bash
# Restore from backup
docker-compose -f deployment/production.yml exec postgres \
  psql -U $DB_USER -d dejavu_prod < previous_backup.sql
```

## Contact Information

### Emergency Contacts
- **DevOps Team**: devops@your-company.com
- **Security Team**: security@your-company.com
- **On-Call Engineer**: +1-xxx-xxx-xxxx

### Escalation Procedures
1. **Level 1**: Application issues - DevOps team
2. **Level 2**: Security incidents - Security team + DevOps lead
3. **Level 3**: Critical system failure - All teams + management

## Appendix

### Useful Commands Reference

```bash
# View all containers
docker ps -a

# Clean up unused resources
docker system prune -f

# View resource usage
docker system df

# Export/Import images
docker save deja-vu:latest | gzip > deja-vu-backup.tar.gz
docker load < deja-vu-backup.tar.gz

# Database maintenance
docker-compose -f deployment/production.yml exec postgres \
  psql -U $DB_USER -d dejavu_prod -c "VACUUM ANALYZE;"
```

### Configuration Files Location
- **Application Config**: `/app/.env.production`
- **Nginx Config**: `deployment/nginx.conf`
- **Docker Compose**: `deployment/production.yml`
- **SSL Certificates**: `deployment/ssl/`
- **Database Migrations**: `supabase/migrations/`

---

**Last Updated**: December 2025  
**Version**: 1.0  
**Maintained By**: DEJA-VU DevOps Team