# Sibling Helper - Deployment & Scaling Guide

## Table of Contents
1. [Deployment Overview](#deployment-overview)
2. [Environment Requirements](#environment-requirements)
3. [Configuration & Environment Variables](#configuration--environment-variables)
4. [Deployment Options](#deployment-options)
5. [Production Setup](#production-setup)
6. [Scaling Strategies](#scaling-strategies)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Troubleshooting Deployment](#troubleshooting-deployment)

## Deployment Overview

The Sibling Helper application consists of multiple components that need to be deployed together:

### Application Components:
- **Child App**: Frontend application for children
- **Parent App**: Frontend application for parents
- **Server API**: Backend server for authentication and data synchronization
- **Shared Module**: Common code shared between apps

### Deployment Architecture:
```
Client Devices → Load Balancer → Web Servers → API Server → Database
```

## Environment Requirements

### Minimum Requirements:
- **Node.js**: Version 16 or higher
- **npm/pnpm**: Package manager
- **Operating System**: Linux, Windows, or macOS
- **Memory**: 2GB RAM (4GB recommended)
- **Storage**: 1GB disk space
- **Ports**: 80/443 (HTTP/HTTPS), 5050 (API)

### Production Recommendations:
- **Docker**: For containerized deployment
- **Reverse Proxy**: Nginx or Apache
- **Process Manager**: PM2 or systemd
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack or similar

## Configuration & Environment Variables

### Server Configuration

Create a `.env` file in the server directory:

```bash
# server/.env
AUTH_REQUIRED=true
JWT_SECRET=your-very-secure-secret-at-least-32-characters
LOG_LEVEL=info
PORT=5050
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000
```

### Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AUTH_REQUIRED` | Enable JWT authentication | Yes | `false` |
| `JWT_SECRET` | JWT signing secret | Yes (if AUTH_REQUIRED) | `''` |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | No | `'info'` |
| `PORT` | Server port | No | `5050` |
| `RATE_LIMIT_WINDOW` | Rate limit window in ms | No | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Max requests per window | No | `300` |

### Production vs Development Configuration

**Development**:
```bash
AUTH_REQUIRED=false
LOG_LEVEL=debug
PORT=5050
```

**Production**:
```bash
AUTH_REQUIRED=true
JWT_SECRET=secure-random-secret-32-chars-minimum
LOG_LEVEL=info
PORT=8080
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000
```

## Deployment Options

### Option 1: Manual Deployment

#### Step-by-Step Manual Deployment:

1. **Install dependencies**:
   ```bash
   # Install Node.js and npm
   curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install pnpm
   npm install -g pnpm
   ```

2. **Build applications**:
   ```bash
   # Build child app
   cd child-app
   pnpm install
   pnpm build

   # Build parent app
   cd ../parent-app
   pnpm install
   pnpm build

   # Build shared module
   cd ../shared
   pnpm install
   pnpm build

   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Configure server**:
   ```bash
   # Create .env file
   echo "AUTH_REQUIRED=true" > .env
   echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
   echo "LOG_LEVEL=info" >> .env
   echo "PORT=8080" >> .env
   ```

4. **Start server**:
   ```bash
   # Using PM2 for process management
   npm install -g pm2
   pm2 start src/index.js --name sibling-helper-server
   pm2 save
   pm2 startup
   ```

5. **Set up reverse proxy** (Nginx example):
   ```nginx
   server {
     listen 80;
     server_name sibling-helper.example.com;

     location / {
       root /path/to/child-app/dist;
       try_files $uri /index.html;
     }

     location /parent/ {
       alias /path/to/parent-app/dist/;
       try_files $uri /parent/index.html;
     }

     location /api/ {
       proxy_pass http://localhost:8080;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
   }
   ```

### Option 2: Docker Deployment

#### Docker Setup:

1. **Create Dockerfile** for server:
   ```dockerfile
   # server/Dockerfile
   FROM node:16-alpine

   WORKDIR /app
   COPY package*.json ./
   RUN npm install

   COPY . .
   EXPOSE 5050

   CMD ["node", "src/index.js"]
   ```

2. **Create docker-compose.yml**:
   ```yaml
   version: '3.8'

   services:
     server:
       build: ./server
       ports:
         - "5050:5050"
       environment:
         - AUTH_REQUIRED=true
         - JWT_SECRET=${JWT_SECRET}
         - LOG_LEVEL=info
       volumes:
         - ./server/data:/app/data
       restart: unless-stopped

     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf
         - ./child-app/dist:/usr/share/nginx/html
         - ./parent-app/dist:/usr/share/nginx/html/parent
         - ./ssl:/etc/nginx/ssl
       depends_on:
         - server
       restart: unless-stopped
   ```

3. **Build and run**:
   ```bash
   # Generate JWT secret
   export JWT_SECRET=$(openssl rand -hex 32)

   # Build frontend apps
   cd child-app && pnpm build
   cd ../parent-app && pnpm build

   # Start containers
   docker-compose up -d --build
   ```

### Option 3: Cloud Deployment (AWS Example)

#### AWS Deployment Steps:

1. **Set up EC2 instance**:
   - t3.medium instance type
   - Amazon Linux 2 AMI
   - Security groups: HTTP(80), HTTPS(443), SSH(22)

2. **Install dependencies**:
   ```bash
   sudo yum update -y
   sudo yum install -y git docker
   sudo service docker start
   sudo usermod -a -G docker ec2-user
   ```

3. **Deploy with Docker**:
   ```bash
   git clone https://github.com/your-repo/sibling-helper.git
   cd sibling-helper

   # Build and run
   docker-compose up -d --build
   ```

4. **Set up Route 53** for DNS
5. **Configure ACM** for SSL certificates
6. **Set up CloudWatch** for monitoring

## Production Setup

### Security Hardening

1. **Enable HTTPS**:
   ```nginx
   server {
     listen 443 ssl;
     server_name sibling-helper.example.com;

     ssl_certificate /etc/nginx/ssl/cert.pem;
     ssl_certificate_key /etc/nginx/ssl/key.pem;
     ssl_protocols TLSv1.2 TLSv1.3;
     ssl_ciphers HIGH:!aNULL:!MD5;

     # ... rest of configuration
   }
   ```

2. **Set security headers**:
   ```nginx
   add_header X-Frame-Options "SAMEORIGIN";
   add_header X-Content-Type-Options "nosniff";
   add_header X-XSS-Protection "1; mode=block";
   add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
   add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.sibling-helper.com; frame-src 'none'; object-src 'none'";
   ```

3. **Configure rate limiting**:
   ```nginx
   limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;

   server {
     location /api/ {
       limit_req zone=api_limit burst=200 nodelay;
       # ... proxy configuration
     }
   }
   ```

### Performance Optimization

1. **Enable compression**:
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   gzip_proxied any;
   gzip_vary on;
   ```

2. **Set up caching**:
   ```nginx
   location / {
     expires 1d;
     add_header Cache-Control "public, no-transform";
   }

   location /api/ {
     expires -1;
     add_header Cache-Control "no-store, no-cache, must-revalidate";
   }
   ```

3. **Optimize static assets**:
   ```bash
   # Use Vite build options
   pnpm build --mode production
   ```

## Scaling Strategies

### Vertical Scaling
- **Upgrade server resources**
- **Increase memory and CPU**
- **Use larger EC2 instances**

### Horizontal Scaling

#### Load Balancing Setup:
```bash
# Using Nginx as load balancer
upstream api_servers {
  server api1.sibling-helper.com:5050;
  server api2.sibling-helper.com:5050;
  server api3.sibling-helper.com:5050;
}

server {
  location /api/ {
    proxy_pass http://api_servers;
    # ... other proxy settings
  }
}
```

#### Database Scaling:
- **Use Redis for caching**
- **Implement database sharding**
- **Set up read replicas**

### Microservices Architecture
For large-scale deployments, consider splitting services:
- **Auth Service**: Dedicated authentication server
- **API Service**: Main application logic
- **Sync Service**: Data synchronization
- **Notification Service**: Push notifications

## Monitoring & Maintenance

### Monitoring Setup

1. **Log aggregation**:
   ```bash
   # ELK Stack setup
   docker run -d -p 5601:5601 -p 9200:9200 -p 5044:5044 --name elk sebp/elk
   ```

2. **Performance monitoring**:
   ```bash
   # Prometheus + Grafana
   docker run -d -p 9090:9090 --name prometheus prom/prometheus
   docker run -d -p 3000:3000 --name grafana grafana/grafana
   ```

3. **Error tracking**:
   ```javascript
   // Add error tracking to server
   const Sentry = require('@sentry/node');
   Sentry.init({ dsn: 'YOUR_DSN' });
   ```

### Maintenance Tasks

1. **Regular backups**:
   ```bash
   # Daily backup script
   0 2 * * * /backup/script.sh
   ```

2. **Dependency updates**:
   ```bash
   # Monthly dependency check
   npm outdated
   npm update
   ```

3. **Security audits**:
   ```bash
   # Weekly security scan
   npm audit
   ```

### Health Checks

1. **API health endpoint**:
   ```bash
   curl -sSf http://localhost:5050/api/health
   ```

2. **Set up monitoring alerts**:
   ```bash
   # Check server status
   if ! curl -sSf http://localhost:5050/api/health; then
     # Send alert
   fi
   ```

## CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy Sibling Helper

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'

    - name: Install pnpm
      run: npm install -g pnpm

    - name: Install dependencies
      run: |
        cd child-app && pnpm install
        cd ../parent-app && pnpm install
        cd ../shared && pnpm install
        cd ../server && npm install

    - name: Build applications
      run: |
        cd child-app && pnpm build
        cd ../parent-app && pnpm build
        cd ../shared && pnpm build

    - name: Run tests
      run: |
        cd child-app && pnpm test
        cd ../parent-app && pnpm test

    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SSH_HOST }}
        username: ${{ secrets.SSH_USER }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/sibling-helper
          git pull origin main
          docker-compose down
          docker-compose up -d --build
```

### Deployment Best Practices

1. **Blue-Green Deployment**:
   - Maintain two identical production environments
   - Switch traffic between environments

2. **Canary Releases**:
   - Roll out updates to small percentage of users
   - Monitor for issues before full deployment

3. **Feature Flags**:
   - Enable/disable features without deployment
   - Gradual rollout of new features

## Troubleshooting Deployment

### Common Deployment Issues

**Issue: Port already in use**
```bash
# Find and kill process
sudo lsof -i :5050
kill -9 <PID>
```

**Issue: Missing dependencies**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Issue: Permission errors**
```bash
# Fix permissions
sudo chown -R $USER:$USER .
sudo chmod -R 755 .
```

**Issue: Database connection failed**
```bash
# Check database permissions
sudo chown -R $USER:$USER server/data
sudo chmod -R 755 server/data
```

### Deployment Checklist

**Pre-Deployment**:
- [ ] Test in staging environment
- [ ] Verify all tests pass
- [ ] Check dependency versions
- [ ] Backup existing data
- [ ] Notify users of maintenance

**During Deployment**:
- [ ] Monitor server resources
- [ ] Check application logs
- [ ] Verify API endpoints
- [ ] Test critical functionality

**Post-Deployment**:
- [ ] Run smoke tests
- [ ] Monitor for errors
- [ ] Check performance metrics
- [ ] Verify data integrity
- [ ] Update documentation

## Scaling Checklist

**Small Scale (1-100 users)**:
- [ ] Single server deployment
- [ ] Basic monitoring
- [ ] Regular backups
- [ ] Manual scaling

**Medium Scale (100-1000 users)**:
- [ ] Load balancing
- [ ] Database replication
- [ ] Caching layer
- [ ] Automated monitoring
- [ ] CI/CD pipeline

**Large Scale (1000+ users)**:
- [ ] Microservices architecture
- [ ] Auto-scaling groups
- [ ] Multi-region deployment
- [ ] Advanced monitoring
- [ ] Dedicated database servers
- [ ] CDN for static assets

This comprehensive deployment guide provides everything needed to deploy, scale, and maintain the Sibling Helper application in production environments.
