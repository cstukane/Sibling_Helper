# Point Request Feature Implementation Plan (Revised)

## Overview
This document outlines the implementation plan for a new feature that allows children to request points for completed tasks directly from their existing quest cards, which parents must then approve or decline.

## Feature Requirements
1. Children can request points by tapping on existing quest/chore cards
2. A confirmation modal appears asking "Did you complete this?"
3. When submitted, the request goes to the parent for approval
4. Parents receive notifications of point requests
5. Parents can approve or decline point requests
6. Points are only awarded after parent approval
7. Declined requests are added back to the child's chore list

## Implementation Details

### 1. Data Structure Changes

#### New Entity: PointRequest
We need to create a new entity to track point requests:

```typescript
type PointRequest = {
  id: string;
  heroId: string;
  questId?: string; // Optional link to existing quest
  points: number;
  title: string; // Title of the quest/chore
  description?: string; // Optional description
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  declinedAt?: string;
};
```

#### Database Changes
- Create a new table/collection for point requests
- Add indexes for heroId and status for efficient querying

### 2. State Management

#### New Hook: usePointRequests
```typescript
function usePointRequests(heroId: string) {
  // Get all point requests for a hero
  // Create new point request
  // Update point request status
}
```

#### Repository: pointRequestRepository
```typescript
const pointRequestRepository = {
  create: (request: Omit<PointRequest, 'id'>) => Promise<string>;
  getByHeroId: (heroId: string) => Promise<PointRequest[]>;
  updateStatus: (id: string, status: 'approved' | 'declined') => Promise<void>;
  getPendingRequests: () => Promise<PointRequest[]>;
};
```

### 3. Backend/API Changes

#### New Endpoints
- `POST /point-requests` - Create a new point request
- `GET /point-requests/:heroId` - Get all point requests for a hero
- `GET /point-requests/pending` - Get all pending requests (for parents)
- `PUT /point-requests/:id/approve` - Approve a point request
- `PUT /point-requests/:id/decline` - Decline a point request

### 4. UI Components

#### Child View Components

##### QuestCompletionModal
- Modal that appears when a child taps on a quest/chore card
- Shows the quest title and points
- Confirmation message: "Did you complete this?"
- Yes/No buttons
- When "Yes" is clicked, creates a point request and shows "Request submitted" message

#### Parent View Components

##### ParentNotificationBadge
- Small badge on the parent mode toggle showing number of pending requests
- Visible only when there are pending requests

##### PointRequestApprovalPanel
- Panel that appears in parent mode showing all pending requests
- Each request shows:
  - Child name
  - Quest title
  - Points requested
  - Request timestamp
  - Approve/Decline buttons

##### PointRequestDetailModal (Optional)
- Detailed view of a specific request when parent taps on it
- Shows all request information
- Approve/Decline actions

### 5. Workflow

#### Child Workflow
1. Child sees their quests/chores on the home screen (existing UI)
2. Child taps on a quest/chore they completed
3. Confirmation modal appears: "Did you complete [Quest Title] for [X] points?"
4. Child clicks "Yes" to submit the request
5. System creates a point request with "pending" status
6. Child sees brief confirmation message: "Request submitted!"

#### Parent Workflow
1. Parent sees notification badge on parent mode toggle when requests exist
2. Parent enters parent mode
3. Parent sees list of pending requests
4. Parent reviews each request and either:
   - Approves: Points are added to child's account, request is marked as approved
   - Declines: Request is marked as declined, quest is added back to child's chore list
5. System updates UI to reflect the action

### 6. Integration with Existing Components

#### QuestCard Component
- Add onClick handler to existing QuestCard component
- When clicked, show QuestCompletionModal
- Pass quest details (title, points) to modal

#### ParentMode Component
- Add PointRequestApprovalPanel to parent mode view
- Fetch and display pending point requests
- Provide approve/decline functionality

### 7. Declined Requests Handling

When a parent declines a request:
1. The system checks if the request is linked to an existing quest (via questId)
2. If it is, the system adds that quest back to the child's available quests for the current day
3. The child can then attempt to complete the quest again
4. If it's not linked to an existing quest (custom task), it's simply marked as declined with no additional action

### 8. Notifications

#### Visual Indicators
- Badge on parent mode toggle showing pending request count
- Optional: Brief toast notification when request is submitted

### 9. Security Considerations

#### Authentication
- Ensure only parents can approve/decline requests
- Ensure children can only create requests for themselves

#### Validation
- Validate point amounts
- Prevent duplicate requests for the same quest within a time period

### 10. Testing Plan

#### Unit Tests
- Point request creation
- Status updates
- Hero point updates
- Quest restoration for declined requests

#### Integration Tests
- Full workflow from request to approval
- Full workflow from request to decline and quest restoration
- Edge cases (declined requests, invalid amounts)

#### UI Tests
- Quest completion modal
- Parent approval interface
- Notification system

### 11. Implementation Steps

1. Create data structures and database schema
2. Implement repositories and services
3. Create state management hooks
4. Modify QuestCard component to show modal on click
5. Create QuestCompletionModal component
6. Create ParentNotificationBadge component
7. Create PointRequestApprovalPanel component
8. Implement declined request handling (quest restoration)
9. Implement notification system
10. Add security checks
11. Write tests
12. User testing and refinement

### 12. Future Enhancements

- Photo upload for proof of completed tasks
- Custom point amounts for unstructured tasks
- Request history and analytics
- Scheduled recurring tasks
- Comments from parents when declining requests to provide feedback