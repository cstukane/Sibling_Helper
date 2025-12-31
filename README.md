# Sibling Helper - Hybrid App Architecture

This project has been refactored to use a hybrid architecture with separate child and parent apps that share a common module.

## Project Structure

- `/app` - Original app (will be deprecated)
- `/child-app` - Simplified interface for children
- `/parent-app` - Full management interface for parents
- `/shared` - Shared components, services, and data models
- `/backup` - Backup of original files

## Shared Module

The shared module contains:

- Data repositories for database access
- Service layers for business logic
- API client for communication between apps
- Shared React components
- TypeScript types

## Child App

The child app is focused on:

- Quest completion and point requests
- Reward shop browsing
- Simple, engaging interface
- No parent controls or management features

## Parent App

The parent app includes:

- Full quest and chore management
- Reward management
- Point request approval system
- Child profile settings
- Security controls

## Development

To run the apps:

1. Install dependencies in each app directory:
   ```bash
   cd child-app && npm install
   cd parent-app && npm install
   cd shared && npm install
   cd server && npm install
   ```

2. Run the apps in development mode:
   ```bash
   # Start child app (port 5173)
   cd child-app && npm run dev

   # Start parent app (port 5174)
   cd parent-app && npm run dev

   # Start API server (port 5050)
   cd server && node src/index.js
   ```

## Data Synchronization

Both apps use the same IndexedDB database for client-side data storage, and the server provides centralized API services for authentication and data synchronization.

## Migration

The original app will be deprecated in favor of the new separate apps. Users will be guided through a migration process to preserve their existing data.

## Deployment

For production deployment, see the comprehensive [DEPLOYMENT.md](docs/DEPLOYMENT.md) guide which includes:

### Quick Start Deployment:
```bash
# Build all applications
cd child-app && pnpm build
cd parent-app && pnpm build
cd shared && pnpm build

# Configure server
cd server
echo "AUTH_REQUIRED=true" > .env
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
echo "LOG_LEVEL=info" >> .env
echo "PORT=8080" >> .env

# Start server with PM2
npm install -g pm2
pm2 start src/index.js --name sibling-helper-server
pm2 save
pm2 startup
```

### Deployment Options:
- **Manual Deployment**: Step-by-step server setup
- **Docker Deployment**: Containerized deployment with docker-compose
- **Cloud Deployment**: AWS, Azure, or GCP deployment guides

### Production Checklist:
- [ ] Set up reverse proxy (Nginx/Apache)
- [ ] Configure HTTPS with valid certificates
- [ ] Enable security headers
- [ ] Set up monitoring and logging
- [ ] Configure backups
- [ ] Implement CI/CD pipeline

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete deployment instructions.

## Security

The application implements comprehensive security measures:

### Security Features:
- **JWT Authentication**: Role-based access control
- **Input Validation**: Prevent injection attacks
- **Rate Limiting**: Protect against brute force
- **Security Headers**: HTTP protection
- **Environment Configuration**: Secure secrets management

### Security Documentation:
See [SECURITY.md](docs/SECURITY.md) for detailed security best practices and implementation guide.

## Troubleshooting

For common issues and solutions, see the comprehensive [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) guide.

### Quick Troubleshooting:
```bash
# Check server logs
tail -f server/logs/server.log

# Test API health
curl http://localhost:5050/api/health

# Clear storage
node clear_storage.js

# Check dependencies
npm audit
```

## Support

For additional help:
- Check the [DOCUMENTATION.md](docs/DOCUMENTATION.md) for detailed feature documentation
- Review the [IMPROVEMENT_PLAN.md](docs/IMPROVEMENT_PLAN.md) for project roadmap
- Consult the [SECURITY.md](docs/SECURITY.md) for security best practices
- Use the [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for issue resolution
- Follow the [DEPLOYMENT.md](docs/DEPLOYMENT.md) for production setup
