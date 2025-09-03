# Seek - Pipe Tobacco Price Comparison

# Check if Docker is available
check-docker:
	@which docker > /dev/null || (echo "❌ Docker not found. Please install Docker Desktop." && exit 1)
	@docker info > /dev/null 2>&1 || (echo "❌ Docker not running. Please start Docker Desktop." && exit 1)
	@echo "✅ Docker is ready"

# Setup command for first-time users
setup: check-docker
	@echo "🚀 Running first-time setup..."
	@./scripts/setup.sh

# Development commands
.PHONY: dev dev-up dev-down dev-logs dev-build setup check-docker

dev-up: check-docker
	docker compose -f docker-compose.dev.yml up -d

dev-down:
	docker compose -f docker-compose.dev.yml down

dev-logs:
	docker compose -f docker-compose.dev.yml logs -f

dev-build: check-docker
	docker compose -f docker-compose.dev.yml build --no-cache

dev: check-docker dev-down dev-build dev-up
	@echo ""
	@echo "🎉 Development environment started!"
	@echo ""
	@echo "Access your application:"
	@echo "  • Frontend: http://localhost:5173"
	@echo "  • Backend API: http://localhost:3001"
	@echo "  • API Health: http://localhost:3001/api/health"
	@echo ""
	@echo "View logs: make dev-logs"

# Production commands
.PHONY: prod prod-up prod-down prod-logs prod-build

prod-up:
	docker compose -f docker/docker-compose.yml up -d

prod-down:
	docker compose -f docker/docker-compose.yml down

prod-logs:
	docker compose -f docker/docker-compose.yml logs -f

prod-build:
	docker compose -f docker/docker-compose.yml build --no-cache

prod: prod-down prod-build prod-up

# Database commands
.PHONY: db-seed db-reset

db-seed:
	docker compose -f docker-compose.dev.yml exec backend npm run seed

db-reset:
	docker compose -f docker-compose.dev.yml exec mongodb mongosh --eval "db.dropDatabase()" seek

# Scraping commands
.PHONY: scrape-all scrape-smokingpipes scrape-countrysquire scrape-stats

scrape-all:
	cd scraping && npm run scrape all

scrape-smokingpipes:
	cd scraping && npm run scrape smokingpipes

scrape-countrysquire:
	cd scraping && npm run scrape countrysquire

scrape-stats:
	cd scraping && npm run scrape stats

# Analytics commands
.PHONY: analytics-setup analytics-start analytics-stop analytics-logs analytics-reset

analytics-setup:
	@echo "🎯 Setting up GoatCounter Analytics..."
	@./scripts/setup-goatcounter.sh

analytics-start:
	docker compose -f docker-compose.dev.yml up -d goatcounter-db goatcounter

analytics-stop:
	docker compose -f docker-compose.dev.yml stop goatcounter goatcounter-db

analytics-logs:
	docker compose -f docker-compose.dev.yml logs -f goatcounter

analytics-reset:
	docker compose -f docker-compose.dev.yml down goatcounter goatcounter-db
	docker volume rm seek_goatcounter_db_dev_data || true
	make analytics-start

# Testing commands
.PHONY: test test-backend test-frontend test-scraping

test:
	make test-backend
	make test-frontend
	make test-scraping

test-backend:
	cd backend && npm test

test-frontend:
	cd frontend && npm test

test-scraping:
	cd scraping && npm test

# Build commands
.PHONY: build build-backend build-frontend build-scraping

build:
	make build-backend
	make build-frontend
	make build-scraping

build-backend:
	cd backend && npm run build

build-frontend:
	cd frontend && npm run build

build-scraping:
	cd scraping && npm run build

# Lint commands
.PHONY: lint lint-backend lint-frontend

lint:
	make lint-backend
	make lint-frontend

lint-backend:
	cd backend && npm run lint

lint-frontend:
	cd frontend && npm run lint

# Clean commands
.PHONY: clean clean-docker clean-deps

clean:
	make clean-docker
	make clean-deps

clean-docker:
	docker system prune -f
	docker volume prune -f

clean-deps:
	rm -rf backend/node_modules backend/dist
	rm -rf frontend/node_modules frontend/dist
	rm -rf scraping/node_modules scraping/dist

# Install commands
.PHONY: install

install:
	cd backend && npm install
	cd frontend && npm install
	cd scraping && npm install

# Help
.PHONY: help

help:
	@echo "🔍 Seek - Pipe Tobacco Price Comparison"
	@echo ""
	@echo "🚀 First-time setup:"
	@echo "  make setup        - Complete automated setup (recommended)"
	@echo "  make check-docker - Verify Docker installation"
	@echo ""
	@echo "🔧 Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make dev-up       - Start containers"
	@echo "  make dev-down     - Stop containers"
	@echo "  make dev-logs     - View logs"
	@echo "  make dev-build    - Rebuild containers"
	@echo ""
	@echo "🚀 Production:"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-up      - Start production containers"
	@echo "  make prod-down    - Stop production containers"
	@echo ""
	@echo "🗄️ Database:"
	@echo "  make db-seed      - Seed database with initial data"
	@echo "  make db-reset     - Reset database"
	@echo ""
	@echo "🕷️ Scraping:"
	@echo "  make scrape-all       - Run all scrapers (traditional mode)"
	@echo "  make scrape-scheduler - Start dynamic limited release scheduler"  
	@echo "  make scrape-limited   - Scan for limited releases only"
	@echo "  make scrape-alerts    - View recent alerts and notifications"
	@echo "  make scrape-monitor   - Monitor high-priority products"
	@echo "  make scrape-stats     - View comprehensive scraping statistics"
	@echo ""
	@echo "📊 Analytics:"
	@echo "  make analytics-setup  - Set up GoatCounter analytics"
	@echo "  make analytics-start  - Start analytics services"
	@echo "  make analytics-stop   - Stop analytics services"
	@echo "  make analytics-logs   - View analytics logs"
	@echo "  make analytics-reset  - Reset analytics database"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test         - Run all tests"
	@echo "  make lint         - Run linting"
	@echo ""
	@echo "🔨 Build:"
	@echo "  make build        - Build all services"
	@echo "  make install      - Install dependencies"
	@echo ""
	@echo "🧹 Utilities:"
	@echo "  make clean        - Clean Docker and dependencies"
	@echo ""
	@echo "📚 URLs when running:"
	@echo "  Frontend:       http://localhost:5173"
	@echo "  Backend API:    http://localhost:3001"
	@echo "  API Health:     http://localhost:3001/api/health"
	@echo "  Analytics:      http://localhost:8080"