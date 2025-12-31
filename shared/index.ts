// Shared data types
export type { Hero } from './types/heroTypes';
export type { Quest } from './types/questTypes';
export type { DailyBoardItem } from './types/boardTypes';
export type { Reward } from './types/rewardTypes';
export type { Redemption } from './types/redemptionTypes';
export type { PointRequest, PointRequestStatus } from './types/pointRequestTypes';

// Shared database
export { db } from './data/db';

// Shared repositories
export { heroRepository } from './data/repositories/heroRepository';
export { questRepository } from './data/repositories/questRepository';
export { boardRepository } from './data/repositories/boardRepository';
export { rewardRepository } from './data/repositories/rewardRepository';
export { redemptionRepository } from './data/repositories/redemptionRepository';
export { pointRequestRepository } from './data/repositories/pointRequestRepository';

// Shared hooks
export { usePointRequests } from './hooks/usePointRequests';

// Shared services
export { pointRequestService } from './services/pointRequestService';
export { questService } from './services/questService';
export { heroService } from './services/heroService';
export { boardService } from './services/boardService';
export { linkingService } from './services/linkingService';
export { taskAssignmentService } from './services/taskAssignmentService';

// Shared API client
export { apiClient } from './api/client';

// Shared theme
export { ThemeProvider, useTheme } from './theme/ThemeProvider';
export { themeTokens, getTokenValue, themeCSSVariables } from './theme/themeTokens';

// Shared components
export { default as QuestCompletionModal } from './components/QuestCompletionModal';
export { default as ParentNotificationBadge } from './components/ParentNotificationBadge';
export { default as PointRequestApprovalPanel } from './components/PointRequestApprovalPanel';
export { default as ErrorBoundary } from './components/ErrorBoundary';
export { default as LoadingIndicator } from './components/LoadingIndicator';
export type { QuestCompletionModalProps } from './components/QuestCompletionModal';
export type { ParentNotificationBadgeProps } from './components/ParentNotificationBadge';
export type { PointRequestApprovalPanelProps } from './components/PointRequestApprovalPanel';
export type { Link, LinkCode, LinkStatus, LinkCodeStatus, LinkLimits } from './types/linkingTypes';
export type { AssignedTask } from './types/assignmentTypes';
export { sharedVersion } from './version';
