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
   ```

2. Run the apps in development mode:
   ```bash
   cd child-app && npm run dev
   cd parent-app && npm run dev
   ```

## Data Synchronization

Both apps use the same IndexedDB database for data storage, ensuring that changes in one app are immediately available in the other.

## Migration

The original app will be deprecated in favor of the new separate apps. Users will be guided through a migration process to preserve their existing data.