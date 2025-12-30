export type LinkedChild = {
  id: string; // Unique identifier for this link
  childId: string; // ID of the child (from their app)
  name: string; // Child's name
  avatarUrl?: string | null; // Child's avatar
  currentPoints: number; // Current reward points
  lastSyncedAt: string; // ISO timestamp of last sync
  pin: string; // 6-digit PIN for this child
};