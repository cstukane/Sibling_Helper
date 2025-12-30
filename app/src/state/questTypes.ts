export type Quest = {
  id: string;
  title: string;
  description?: string | null;
  category: 'helping' | 'quiet' | 'kindness' | 'custom' | 'chores';
  points: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  recurrence?: 'daily' | 'weekly' | 'monthly' | null; // Only applicable for chores
};