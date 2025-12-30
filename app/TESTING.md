# Test Suite for Big Sibling Helper

## Overview

This document describes the test suite for the Big Sibling Helper application. The test suite includes unit tests for various components and repositories of the application.

## Test Structure

The tests are organized in the following structure:

```
src/
├── __tests__/
│   ├── basic.test.ts              # Simple test to verify test environment
│   ├── hero.test.ts               # Tests for hero state management
│   ├── quests.test.ts             # Tests for quests state management
│   ├── board.test.ts              # Tests for board state management
│   ├── rewards.test.ts            # Tests for rewards state management
│   ├── redemptions.test.ts        # Tests for redemptions state management
│   ├── pinManager.test.ts         # Tests for PIN management utility
│   ├── sfx.test.ts                # Tests for sound effects utility
│   └── app.test.tsx               # Tests for main App component
├── components/
│   └── __tests__/
│       ├── QuestCard.test.tsx     # Tests for QuestCard component
│       ├── ProgressBar.test.tsx   # Tests for ProgressBar component
│       ├── PinPad.test.tsx        # Tests for PinPad component
│       └── RewardCard.test.tsx    # Tests for RewardCard component
└── data/
    └── repositories/
        └── __tests__/
            ├── heroRepository.test.ts        # Tests for hero repository
            ├── questRepository.test.ts       # Tests for quest repository
            ├── boardRepository.test.ts       # Tests for board repository
            ├── rewardRepository.test.ts      # Tests for reward repository
            └── redemptionRepository.test.ts  # Tests for redemption repository
```

## Test Categories

### 1. Component Tests
- **QuestCard**: Tests for the quest card component including rendering, completion functionality, and accessibility
- **ProgressBar**: Tests for the progress bar component
- **PinPad**: Tests for the PIN pad component including input handling and accessibility
- **RewardCard**: Tests for the reward card component

### 2. State Management Tests
- **Hero**: Tests for hero state management including initialization and updates
- **Quests**: Tests for quest state management including CRUD operations
- **Board**: Tests for board state management including quest completion
- **Rewards**: Tests for reward state management including CRUD operations
- **Redemptions**: Tests for redemption state management

### 3. Repository Tests
- **Hero Repository**: Tests for database operations related to heroes
- **Quest Repository**: Tests for database operations related to quests
- **Board Repository**: Tests for database operations related to daily boards
- **Reward Repository**: Tests for database operations related to rewards
- **Redemption Repository**: Tests for database operations related to redemptions

### 4. Utility Tests
- **PIN Manager**: Tests for PIN management functionality
- **Sound Effects**: Tests for sound effects utility

## Test Commands

The following test commands are available:

- `pnpm test`: Run all tests
- `pnpm test:watch`: Run tests in watch mode
- `pnpm test:unit`: Run unit tests
- `pnpm test:components`: Run component tests
- `pnpm test:repositories`: Run repository tests
- `pnpm test:coverage`: Run tests with coverage report

## Current Status

- ✅ Basic test environment is working
- ⚠️ Several repository tests are failing due to mocking issues
- ⚠️ Some import paths need to be corrected
- ⚠️ Component tests need to be implemented

## Next Steps

1. Fix import path issues in test files
2. Correct mocking implementation for Dexie database operations
3. Implement missing component tests
4. Add end-to-end tests using Playwright
5. Improve test coverage for edge cases

## Test Coverage Goals

- Core logic (state management, repositories): ≥80% coverage
- Components: ≥70% coverage
- Utilities: ≥90% coverage
- End-to-end tests: Cover all main user flows