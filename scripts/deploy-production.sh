#!/bin/bash

# Seek Production Deployment Script
# This script deploys Seek to production with proper security measures

set -e  # Exit on any error

echo "🚀 Starting Seek Production Deployment"

# Check if running as root (needed for SSL setup)
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root. Please run as a regular user with sudo access."
   exit 1
fi

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker service."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Function to generate random password
generate_password() {
    openssl rand -base64 32
}

# Function to generate random secret
generate_secret() {
    openssl rand -hex 64
}

# Create production environment file if it doesn't exist
if [ ! -f .env.production ]; then
    echo "📝 Creating production environment file..."
    cp .env.production .env.production.backup 2>/dev/null || true
    
    # Generate secure credentials
    MONGO_PASSWORD=$(generate_password)
    SESSION_SECRET=$(generate_secret)
    
    # Prompt for domain
    read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
    read -p "Enter your email for Let's Encrypt SSL: " LETSENCRYPT_EMAIL
    
    # Create .env.production with secure values
    cat > .env.production << EOF
# Production Environment Variables - Generated $(date)

# MongoDB Credentials
MONGO_ROOT_USER=seek_admin
MONGO_ROOT_PASSWORD=${MONGO_PASSWORD}

# Security
SESSION_SECRET=${SESSION_SECRET}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Scraping Configuration
SCRAPING_DELAY=2000
SCRAPING_TIMEOUT=30000

# Domain Configuration
DOMAIN_NAME=${DOMAIN_NAME}

# SSL/TLS
LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL}
EOF
    
    echo "✅ Production environment file created with secure credentials"
else
    echo "✅ Production environment file already exists"
fi

# Load environment variables
source .env.production

# Update nginx configuration with actual domain
echo "📝 Updating nginx configuration..."
sed -i.bak "s/your-domain.com/${DOMAIN_NAME}/g" docker/nginx.conf
sed -i.bak "s/your-domain.com/${DOMAIN_NAME}/g" docker-compose.prod.yml

# Create SSL certificate directory
sudo mkdir -p /etc/letsencrypt/live/${DOMAIN_NAME}

# Check if SSL certificates exist
if [ ! -f "/etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem" ]; then
    echo "🔒 SSL certificates not found. Setting up Let's Encrypt..."
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        echo "Installing certbot..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install certbot
        else
            sudo apt-get update && sudo apt-get install -y certbot
        fi
    fi
    
    # Stop any services using ports 80/443
    echo "📡 Stopping any conflicting services..."
    sudo pkill -f nginx || true
    docker-compose -f docker-compose.prod.yml down || true
    
    # Generate SSL certificate
    sudo certbot certonly --standalone \
        --email ${LETSENCRYPT_EMAIL} \
        --agree-tos \
        --no-eff-email \
        -d ${DOMAIN_NAME} \
        -d www.${DOMAIN_NAME}
    
    echo "✅ SSL certificates generated successfully"
else
    echo "✅ SSL certificates already exist"
fi

# Build production images
echo "🔨 Building production Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start production services
echo "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ Backend service is healthy"
else
    echo "❌ Backend service health check failed"
    docker-compose -f docker-compose.prod.yml logs backend
fi

# Setup automatic SSL renewal
echo "🔄 Setting up SSL certificate auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f $(pwd)/docker-compose.prod.yml restart nginx") | crontab -

# Setup scraping schedule
echo "📅 Setting up scraping schedule..."
SCRIPT_PATH=$(pwd)
(crontab -l 2>/dev/null; echo "0 */6 * * * cd ${SCRIPT_PATH} && docker-compose -f docker-compose.prod.yml exec -T scraping npm run scrape all") | crontab -

# Create backup script
cat > scripts/backup-production.sh << 'EOF'
#!/bin/bash
# Production backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/seek"
mkdir -p ${BACKUP_DIR}

echo "Creating MongoDB backup..."
docker-compose -f docker-compose.prod.yml exec -T mongodb mongodump --authenticationDatabase admin -u ${MONGO_ROOT_USER} -p ${MONGO_ROOT_PASSWORD} --archive --gzip > ${BACKUP_DIR}/seek_${DATE}.gz

# Keep only last 7 backups
find ${BACKUP_DIR} -name "seek_*.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_DIR}/seek_${DATE}.gz"
EOF

chmod +x scripts/backup-production.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * ${SCRIPT_PATH}/scripts/backup-production.sh") | crontab -

echo ""
echo "🎉 Production deployment completed successfully!"
echo ""
echo "📋 Post-deployment checklist:"
echo "1. ✅ Verify your domain DNS points to this server"
echo "2. ✅ Test HTTPS: https://${DOMAIN_NAME}"
echo "3. ✅ Test API health: https://${DOMAIN_NAME}/api/health"
echo "4. ✅ Monitor logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "5. ✅ Run initial scraping: docker-compose -f docker-compose.prod.yml exec scraping npm run scrape all"
echo ""
echo "🔧 Management commands:"
echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "  Update deployment: docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d"
echo "  Backup database: ./scripts/backup-production.sh"
echo ""
echo "🛡️ Security notes:"
echo "  - MongoDB is not exposed externally (secure)"
echo "  - SSL certificates will auto-renew"
echo "  - Rate limiting is enabled"
echo "  - Security headers are configured"
echo ""
echo "📊 Access your application at: https://${DOMAIN_NAME}"