export type Recurrence = {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  rule?: string; // e.g., RFC5545 RRULE if supported
};

export type Quest = {
  id: string;
  title: string;
  description?: string | null;
  category?: string;
  points: number;
  active: boolean;
  // If recurrence is null/undefined => Quest
  recurrence?: Recurrence;
  updated_at: string;
  created_at: string;
};