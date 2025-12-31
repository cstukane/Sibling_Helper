# Big Sibling Helper - Documentation

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Getting Started](#getting-started)
4. [Development](#development)
5. [Testing](#testing)
6. [Recent Enhancements](#recent-enhancements)
7. [Troubleshooting](#troubleshooting)

## Overview

Big Sibling Helper is a kid-friendly "quest board" web app that turns helpful big-sibling behaviors into fun quests with instant feedback, simple rewards, and optional whole-home announcements.

## Features

### Dual-Point System
The app features a dual-point system:
- **Progression Points**: Used exclusively for leveling up the child (only increases)
- **Reward Points**: Used for purchasing rewards in the shop (can increase/decrease)

When a child completes a quest or chore, they earn points for BOTH progression AND rewards. However, when they spend points on rewards, only their reward points decrease - their progression points and level remain intact.

### Profile Customization
Parents can customize their child's profile:
- Change the child's name
- Upload a profile picture/avatar
- Profile information displayed in Kid Mode

### Task Management
Three types of tasks:
- **Quests**: One-time tasks that help develop good habits
- **Chores**: Recurring tasks that can be assigned daily or weekly
- **Rewards**: Items that can be purchased with reward points

### Reward System
- Create and manage rewards in Parent Mode
- Assign point costs to rewards
- Secure reward redemption with parent PIN

### Parent Settings
- **Dark Mode**: Toggle between light and dark themes for better nighttime viewing
- **PIN Management**: Change the parent PIN for accessing Parent Mode
- **Data Reset**: Emergency reset for troubleshooting

### Offline-first PWA
- Works offline and can be installed as a mobile app
- Data persisted in browser using IndexedDB
- Automatic synchronization when online

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- PNPM package manager

### Installation
1. Clone the repository
2. Navigate to the `app` directory
3. Run `pnpm install`

### Running the Application
- Development: `pnpm dev`
- Production: `pnpm build`

## Development

### Current Project Structure (Hybrid Architecture)

The project has been refactored to use a hybrid architecture with separate applications:

```
.
├── child-app/          # Simplified interface for children
│   ├── src/            # Child-specific source code
│   ├── public/         # Public assets
│   └── e2e/           # End-to-end tests
│
├── parent-app/         # Full management interface for parents
│   ├── src/            # Parent-specific source code
│   ├── public/         # Public assets
│   └── e2e/           # End-to-end tests
│
├── shared/             # Shared components and services
│   ├── api/            # API client and server interfaces
│   ├── components/     # Shared React components
│   ├── data/           # Data repositories and models
│   ├── hooks/          # Custom React hooks
│   ├── services/       # Business logic services
│   ├── theme/          # Theme management
│   └── types/          # TypeScript type definitions
│
├── server/             # Backend server
│   ├── src/            # Server source code
│   │   └── index.js   # Main server with security features
│   ├── data/           # Server data storage
│   └── package.json    # Server dependencies
│
├── app/                # Original app (deprecated)
├── backup/             # Backup of original files
├── docs/               # Documentation
│   ├── SECURITY.md     # Security best practices
│   ├── TROUBLESHOOTING.md # Troubleshooting guide
│   ├── DEPLOYMENT.md   # Deployment instructions
│   └── DOCUMENTATION.md # This file
│
├── *.bat              # Batch scripts for development
└── README.md           # Project overview
```

### Legacy vs Current Architecture

**Original Architecture (app/)**:
- Single monolithic application
- Combined parent and child functionality
- Direct IndexedDB access
- Limited security features

**Current Hybrid Architecture**:
- Separate child and parent applications
- Shared module for common functionality
- Centralized API server
- Comprehensive security implementation
- Better separation of concerns
- Improved maintainability

### Development Workflow

1. **Start development servers**:
   ```bash
   # Start child app
   cd child-app && pnpm dev

   # Start parent app
   cd parent-app && pnpm dev

   # Start API server
   cd server && node src/index.js
   ```

2. **Build for production**:
   ```bash
   # Build all applications
   cd child-app && pnpm build
   cd parent-app && pnpm build
   cd shared && pnpm build
   ```

3. **Run tests**:
   ```bash
   # Run unit tests
   pnpm test

   # Run end-to-end tests
   pnpm test:e2e
   ```

### Shared Module Usage

The shared module provides common functionality:

```typescript
// Import shared components
import { useHeroRepository } from 'shared/data';
import { ThemeProvider } from 'shared/theme';
import { apiClient } from 'shared/api';

// Use shared services
const heroRepo = useHeroRepository();
const heroes = heroRepo.getHeroes();
```

### Data Flow

```
Child App → Shared API Client → Server API → Database
Parent App → Shared API Client → Server API → Database
```

### Security Implementation

The current architecture includes comprehensive security:
- **JWT Authentication**: Secure API access
- **Role-Based Authorization**: Parent/child separation
- **Input Validation**: Prevent injection attacks
- **Rate Limiting**: Protect against brute force
- **Security Headers**: HTTP protection

See [SECURITY.md](SECURITY.md) for detailed security documentation.

### Development Scripts
- `pnpm dev` - Start the development server
- `pnpm build` - Build the production version
- `pnpm test` - Run unit tests
- `pnpm test:e2e` - Run end-to-end tests
- `pnpm lint` - Lint the code
- `pnpm format` - Format the code

## Testing

### Unit Tests
Located in `src/__tests__` and component-specific test directories.

### Component Tests
Located in component-specific `__tests__` directories.

### End-to-End Tests
Located in `e2e` directory.

Run tests with `pnpm test` or `test.bat`.

## Recent Enhancements

### UI/UX Improvements
1. **Parent Mode Toggle Relocation**
   - Moved Parent Mode toggle to bottom-right corner
   - Reduced button size to 40x40px for less intrusive presence
   - Added visual indication of current mode (P for Parent mode, Kid for Kid mode)
   - Maintained all functionality while improving aesthetics

2. **Header Simplification**
   - Removed "Big Sibling Helper" header text
   - Simplified overall design for cleaner interface
   - Reduced visual clutter for better readability

3. **Navigation Improvements**
   - Added back button to return from Reward Shop to Quests
   - Improved spacing and alignment of UI elements
   - Enhanced visual hierarchy for better user guidance

### Chores Feature Addition
1. **Concept**
   - Added Chores as a new category of tasks that can be:
     - One-time or recurring (daily, weekly, monthly)
     - Award points for BOTH progression AND rewards
     - Managed separately from regular quests

2. **Implementation Details**
   - Added "Chores" tab in Parent Mode
   - Created recurrence options (daily, weekly, monthly)
   - Integrated with existing point systems
   - Added recurrence information to Quest type

3. **Technical Implementation**
   - Updated Quest type to include recurrence field
   - Enhanced questRepository to handle recurring chores
   - Modified ParentMode component to include Chores tab
   - Updated QuestForm component to support recurrence options

### Dual-Point System Enhancement
1. **Concept**
   - Implemented a dual-point system where:
     - **Progression Points**: Used exclusively for leveling up (only increases)
     - **Reward Points**: Used for purchasing rewards (can increase/decrease)

2. **Technical Implementation**
   - Updated Hero type with separate progressionPoints and rewardPoints fields
   - Enhanced heroRepository with specialized methods:
     - addProgressionPoints() - Only increases progression points
     - addRewardPoints() - Increases reward points
     - spendRewardPoints() - Decreases reward points
     - earnPointsFromQuest() - Increases BOTH point types
   - Updated UI to display both point types

3. **Business Logic**
   - Completing quests increases BOTH progression AND reward points
   - Spending rewards only decreases reward points
   - Progression points and levels can only increase
   - Levels calculated solely from progression points

## Troubleshooting

### Common Issues
1. **Database Errors**: Clear browser cache and localStorage
2. **Import Errors**: Check file paths and run `pnpm install`
3. **Test Failures**: Run tests individually to isolate issues

### Resetting Data
1. Use Parent Mode Settings to reset all data
2. Or manually clear localStorage and IndexedDB
