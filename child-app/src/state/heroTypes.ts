export type Hero = {
  id: string;
  name: string;
  progressionPoints: number; // Points for leveling up (only increases)
  rewardPoints: number;      // Points for spending in reward shop (can decrease when spending)
  streakDays: number;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string | null;
};