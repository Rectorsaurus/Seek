#!/bin/bash

# Seek Project Setup Script
# This script ensures all dependencies are installed and the project can start successfully

set -e  # Exit on any error

echo "🚀 Starting Seek Project Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ] || [ ! -d "scraping" ]; then
    print_error "Please run this script from the root of the Seek project directory"
    exit 1
fi

print_status "Checking system requirements..."

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker Desktop from https://www.docker.com/products/docker-desktop/"
    echo "  For macOS: https://desktop.docker.com/mac/main/arm64/Docker.dmg"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is installed but not running. Please start Docker Desktop."
    exit 1
fi

print_success "Docker is installed and running"

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    if ! docker-compose version &> /dev/null; then
        print_error "Docker Compose is not available. Please update Docker Desktop."
        exit 1
    else
        print_warning "Using legacy docker-compose. Consider updating Docker Desktop for better performance."
        # Update Makefile and package.json to use docker-compose instead
        sed -i.bak 's/docker compose/docker-compose/g' Makefile
        sed -i.bak 's/docker compose/docker-compose/g' package.json
    fi
fi

print_success "Docker Compose is available"

# Check if Node.js is installed (for local development)
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"
else
    print_warning "Node.js is not installed. This is OK for Docker-only development."
fi

print_status "Setting up environment files..."

# Create .env files if they don't exist
ENV_FILES=("backend/.env" "frontend/.env" "scraping/.env")
for env_file in "${ENV_FILES[@]}"; do
    if [ ! -f "$env_file" ]; then
        if [ -f "$env_file.example" ]; then
            cp "$env_file.example" "$env_file"
            print_success "Created $env_file from example"
        else
            print_warning "$env_file.example not found, skipping $env_file"
        fi
    else
        print_success "$env_file already exists"
    fi
done

print_status "Checking Docker Compose configuration..."

# Validate docker-compose file
if docker compose -f docker-compose.dev.yml config &> /dev/null; then
    print_success "Docker Compose configuration is valid"
else
    print_error "Docker Compose configuration has errors"
    docker compose -f docker-compose.dev.yml config
    exit 1
fi

print_status "Cleaning up any existing containers..."

# Clean up existing containers
docker compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true

print_status "Building Docker images (this may take a few minutes)..."

# Build images
if docker compose -f docker-compose.dev.yml build --no-cache; then
    print_success "Docker images built successfully"
else
    print_error "Failed to build Docker images"
    exit 1
fi

print_status "Starting services..."

# Start services
if docker compose -f docker-compose.dev.yml up -d; then
    print_success "Services started successfully"
else
    print_error "Failed to start services"
    exit 1
fi

print_status "Waiting for services to be ready..."

# Wait for services to be healthy
sleep 10

# Check if services are running
SERVICES=("seek-mongodb-dev" "seek-backend-dev" "seek-frontend-dev" "seek-scraping-dev")
ALL_RUNNING=true

for service in "${SERVICES[@]}"; do
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$service.*Up"; then
        print_success "$service is running"
    else
        print_error "$service is not running properly"
        ALL_RUNNING=false
    fi
done

if [ "$ALL_RUNNING" = true ]; then
    print_success "All services are running!"
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "You can now access:"
    echo "  • Frontend: http://localhost:5173"
    echo "  • Backend API: http://localhost:3001"
    echo "  • API Health: http://localhost:3001/api/health"
    echo ""
    echo "Useful commands:"
    echo "  • View logs: make dev-logs"
    echo "  • Stop services: make dev-down"
    echo "  • Restart services: make dev"
    echo "  • Run scrapers: make scrape-all"
    echo ""
    
    # Test API health
    sleep 5
    if curl -s http://localhost:3001/api/health > /dev/null; then
        print_success "Backend API is responding"
    else
        print_warning "Backend API is not responding yet (this is normal, it may need more time)"
    fi
else
    print_error "Some services failed to start. Check logs with: make dev-logs"
    exit 1
fi