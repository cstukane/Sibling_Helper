export type DailyBoardItem = {
  id: string;
  questId: string;
  date: string; // YYYY-MM-DD
  heroId: string;
  completedAt: string | null;
};