# DEJA-VU Development Setup Script for Windows

Write-Host "🚀 Setting up DEJA-VU development environment..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Start Docker services
Write-Host "📦 Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d postgres redis

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if services are healthy
Write-Host "🔍 Checking service health..." -ForegroundColor Yellow
docker-compose ps

# Install dependencies if not already installed
if (!(Test-Path "node_modules")) {
    Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Run initial tests to verify setup
Write-Host "🧪 Running initial tests..." -ForegroundColor Yellow
npm run test

Write-Host "✅ Development environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure Supabase project and update .env.local" -ForegroundColor White
Write-Host "2. Run 'npm run dev' to start the development server" -ForegroundColor White
Write-Host "3. Run 'docker-compose up -d' to start services" -ForegroundColor White
Write-Host "4. Access Redis Commander at http://localhost:8081" -ForegroundColor White