export type PointRequestStatus = 'pending' | 'approved' | 'declined';

export type PointRequest = {
  id: string;
  heroId: string;
  questId?: string; // Optional link to existing quest
  points: number;
  title: string; // Title of the quest/chore
  description?: string; // Optional description
  status: PointRequestStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  declinedAt?: string;
};