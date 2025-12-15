#!/bin/bash

# DEJA-VU Development Setup Script

echo "🚀 Setting up DEJA-VU development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start Docker services
echo "📦 Starting Docker services..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are healthy
echo "🔍 Checking service health..."
docker-compose ps

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Run initial tests to verify setup
echo "🧪 Running initial tests..."
npm run test

echo "✅ Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure Supabase project and update .env.local"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Run 'docker-compose up -d' to start services"
echo "4. Access Redis Commander at http://localhost:8081"