# 🚀 Seek - Quick Start Guide

Get your pipe tobacco price comparison platform running in under 5 minutes!

## Prerequisites

- **Docker Desktop** - Download from [docker.com](https://www.docker.com/products/docker-desktop/)
  - For M4 Mac Mini: [Direct Download](https://desktop.docker.com/mac/main/arm64/Docker.dmg)

## 🎯 Option 1: Automated Setup (Recommended)

```bash
# Clone and enter project
git clone <your-repo-url>
cd seek

# Run automated setup (handles everything!)
make setup
```

The setup script will:
- ✅ Check Docker installation
- ✅ Create all environment files  
- ✅ Build Docker images
- ✅ Start all services
- ✅ Verify everything is working

## 🎯 Option 2: Manual Steps

```bash
# 1. Install Docker Desktop and start it

# 2. Clone project
git clone <your-repo-url>
cd seek

# 3. Start development environment
make dev
```

## 🌐 Access Your Application

After startup, you can access:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001  
- **API Health Check**: http://localhost:3001/api/health

## 🔧 Common Commands

```bash
# View logs
make dev-logs

# Stop everything
make dev-down

# Restart services
make dev

# Run web scrapers
make scrape-all

# View scraping stats
make scrape-stats

# Get help
make help
```

## 🐛 Troubleshooting

### Docker Issues
```bash
# Check Docker status
make check-docker

# If Docker not found:
# Install Docker Desktop from docker.com

# If Docker not running:
# Start Docker Desktop application
```

### Port Conflicts
If ports 3001, 5173, or 27017 are in use:
```bash
# Find and stop conflicting processes
sudo lsof -i :3001
sudo lsof -i :5173  
sudo lsof -i :27017
```

### Container Issues
```bash
# Clean restart
make dev-down
make clean-docker
make dev
```

### Still Having Issues?
1. Check logs: `make dev-logs`
2. Verify Docker: `make check-docker`  
3. Clean restart: `make dev-down && make dev`

## 🎉 You're Ready!

Your pipe tobacco price comparison platform is now running. You can:

- Browse products at http://localhost:5173
- Test the API at http://localhost:3001/api/health
- Run scrapers to populate data with `make scrape-all`

Happy coding! 🚀