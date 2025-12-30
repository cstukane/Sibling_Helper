export type Redemption = {
  id: string;
  heroId: string;
  rewardId: string;
  pointsSpent: number;
  redeemedAt: string;
  notes?: string | null;
};