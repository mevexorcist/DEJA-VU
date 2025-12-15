#!/bin/bash

# DEJA-VU Production Deployment Script

set -e

echo "🚀 Starting DEJA-VU Production Deployment..."

# Check if required environment variables are set
required_vars=("SUPABASE_URL" "SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY" "JWT_SECRET" "ENCRYPTION_KEY" "DB_USER" "DB_PASSWORD")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Environment variable $var is not set"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Create necessary directories
mkdir -p logs
mkdir -p ssl

echo "📁 Created deployment directories"

# Build and start services
echo "🔨 Building Docker images..."
docker-compose -f production.yml build --no-cache

echo "🗄️ Starting database services..."
docker-compose -f production.yml up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 30

# Run database migrations
echo "🔄 Running database migrations..."
docker-compose -f production.yml exec postgres psql -U $DB_USER -d dejavu_prod -f /docker-entrypoint-initdb.d/001_initial_schema.sql
docker-compose -f production.yml exec postgres psql -U $DB_USER -d dejavu_prod -f /docker-entrypoint-initdb.d/002_indexes.sql
docker-compose -f production.yml exec postgres psql -U $DB_USER -d dejavu_prod -f /docker-entrypoint-initdb.d/003_rls_policies.sql
docker-compose -f production.yml exec postgres psql -U $DB_USER -d dejavu_prod -f /docker-entrypoint-initdb.d/004_functions_triggers.sql
docker-compose -f production.yml exec postgres psql -U $DB_USER -d dejavu_prod -f /docker-entrypoint-initdb.d/005_auth_setup.sql
docker-compose -f production.yml exec postgres psql -U $DB_USER -d dejavu_prod -f /docker-entrypoint-initdb.d/006_security_logging.sql
docker-compose -f production.yml exec postgres psql -U $DB_USER -d dejavu_prod -f /docker-entrypoint-initdb.d/007_monitoring_alerts.sql

echo "✅ Database migrations completed"

# Start application services
echo "🚀 Starting application services..."
docker-compose -f production.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 60

# Health check
echo "🏥 Running health checks..."
if curl -f http://localhost/health; then
    echo "✅ Application is healthy and ready!"
else
    echo "❌ Health check failed"
    docker-compose -f production.yml logs
    exit 1
fi

# Display service status
echo "📊 Service Status:"
docker-compose -f production.yml ps

echo "🎉 DEJA-VU deployment completed successfully!"
echo "🌐 Application is available at: https://your-domain.com"
echo "📊 Health check endpoint: https://your-domain.com/health"
echo "📈 Metrics endpoint: https://your-domain.com/api/metrics"

# Show logs
echo "📝 Showing recent logs..."
docker-compose -f production.yml logs --tail=50

echo "🔍 To monitor logs in real-time, run:"
echo "docker-compose -f production.yml logs -f"