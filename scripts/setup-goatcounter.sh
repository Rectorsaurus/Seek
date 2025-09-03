#!/bin/bash

# GoatCounter Setup Script
# This script helps initialize GoatCounter for the Seek project

set -e

echo "🎯 Setting up GoatCounter Analytics..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create environment files if they don't exist
if [ ! -f ".env.local" ]; then
    echo "📄 Creating .env.local from example..."
    cp .env.goatcounter.example .env.local
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "📄 Creating frontend/.env.local from example..."
    cp frontend/.env.example frontend/.env.local
fi

if [ ! -f "backend/.env.local" ]; then
    echo "📄 Creating backend/.env.local from example..."
    cp backend/.env.example backend/.env.local
fi

echo "🚀 Starting GoatCounter services..."
docker compose -f docker-compose.dev.yml up -d goatcounter-db goatcounter

echo "⏳ Waiting for GoatCounter to be ready..."
sleep 10

# Check if GoatCounter is accessible
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ GoatCounter is running at http://localhost:8080"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Visit http://localhost:8080 to set up your first site"
    echo "2. Create a site with code 'seek-tobacco'"
    echo "3. Copy the API key and update your .env files"
    echo "4. Run 'make dev' to start the full development environment"
    echo ""
    echo "📚 Documentation: https://github.com/arp242/goatcounter"
else
    echo "⚠️ GoatCounter might still be starting. Please wait a few more seconds and check http://localhost:8080"
fi