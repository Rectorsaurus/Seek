# Seek Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- MongoDB (if not using Docker)
- M4 Mac Mini or compatible ARM64/x86_64 system

## Development Setup

### Option 1: Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd seek
   ```

2. **Start development environment**
   ```bash
   make dev
   # or
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - MongoDB: localhost:27017

### Option 2: Local Development

1. **Install dependencies**
   ```bash
   make install
   # or
   npm run install:all
   ```

2. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   cp scraping/.env.example scraping/.env
   ```

3. **Start MongoDB**
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   ```

4. **Start services**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   
   # Terminal 3 - Scraping (optional)
   cd scraping && npm run dev
   ```

## Production Deployment

### Using Docker Compose

1. **Prepare environment**
   ```bash
   # Copy and configure production environment files
   cp docker/.env.example docker/.env
   # Edit docker/.env with production values
   ```

2. **Deploy**
   ```bash
   make prod
   # or
   npm run prod
   ```

3. **Run initial data setup**
   ```bash
   # Seed retailers and initial data
   make db-seed
   
   # Run initial scraping
   make scrape-all
   ```

### Manual Deployment

1. **Build all services**
   ```bash
   make build
   ```

2. **Set up MongoDB**
   ```bash
   # Install MongoDB 7.0
   # Configure with authentication
   # Run initialization script: docker/mongo-init.js
   ```

3. **Deploy Backend**
   ```bash
   cd backend
   npm ci --only=production
   npm run build
   
   # Set environment variables
   export NODE_ENV=production
   export PORT=3001
   export MONGODB_URI=mongodb://username:password@localhost:27017/seek
   
   # Start with PM2 or similar process manager
   npm start
   ```

4. **Deploy Frontend**
   ```bash
   cd frontend
   npm ci
   npm run build
   
   # Serve with nginx or similar web server
   # Point to ./dist directory
   ```

5. **Deploy Scraping Service**
   ```bash
   cd scraping
   npm ci --only=production
   npm run build
   
   # Set up cron job or scheduler to run:
   # node dist/scraper.js all
   ```

## Environment Configuration

### Backend (.env)
```bash
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/seek
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3001/api
```

### Scraping (.env)
```bash
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/seek
SCRAPING_DELAY=1000
SCRAPING_TIMEOUT=30000
```

## Monitoring and Maintenance

### Health Checks

- Backend health: `GET http://localhost:3001/api/health`
- Database connection: Check MongoDB logs
- Scraping status: `make scrape-stats`

### Log Management

```bash
# View logs
make dev-logs  # Development
make prod-logs # Production

# Individual service logs
docker logs seek-backend
docker logs seek-frontend
docker logs seek-scraping
```

### Database Maintenance

```bash
# Backup database
mongodump --uri="mongodb://localhost:27017/seek" --out=backup/

# Restore database
mongorestore --uri="mongodb://localhost:27017/seek" backup/seek/

# Reset database
make db-reset
```

### Scraping Schedule

Set up a cron job to run scraping regularly:

```bash
# Run every 6 hours
0 */6 * * * cd /path/to/seek && make scrape-all

# Check scraping stats daily
0 9 * * * cd /path/to/seek && make scrape-stats
```

## Performance Optimization

### Database Indexes

Ensure MongoDB indexes are created (done automatically in mongo-init.js):
- Text search index on products (name, brand, description)
- Price and availability indexes
- Retailer indexes

### Caching

- Frontend: Browser caching via service worker
- Backend: Consider Redis for API response caching
- Database: MongoDB built-in caching

### Scaling

- **Horizontal scaling**: Deploy multiple backend instances behind load balancer
- **Database scaling**: MongoDB replica sets or sharding
- **CDN**: Use CDN for frontend static assets

## Security Considerations

1. **Environment Variables**: Never commit .env files
2. **Database**: Use authentication and secure connections
3. **API**: Implement rate limiting and input validation
4. **HTTPS**: Use SSL/TLS in production
5. **Secrets**: Use secrets management system in production

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in docker-compose files
2. **MongoDB connection**: Check connection string and auth
3. **Playwright issues**: Ensure dependencies are installed
4. **CORS errors**: Check frontend API URL configuration

### Debugging

```bash
# Check service status
docker ps
docker logs <container-name>

# Debug scraping issues
cd scraping
npm run scrape stats

# Test API endpoints
curl http://localhost:3001/api/health
curl http://localhost:3001/api/products/search
```

## Backup and Recovery

### Automated Backups

```bash
#!/bin/bash
# backup-script.sh
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="mongodb://localhost:27017/seek" --out="backups/seek_$DATE"
tar -czf "backups/seek_$DATE.tar.gz" "backups/seek_$DATE"
rm -rf "backups/seek_$DATE"

# Keep only last 7 backups
ls -1t backups/*.tar.gz | tail -n +8 | xargs -r rm
```

### Recovery Process

```bash
# Stop services
make dev-down

# Restore database
tar -xzf backups/seek_20231201_120000.tar.gz
mongorestore --uri="mongodb://localhost:27017/seek" --drop backups/seek_20231201_120000/seek/

# Restart services
make dev-up
```