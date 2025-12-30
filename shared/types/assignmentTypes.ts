export type AssignedTask = {
  id: string;
  parentId: string;
  childId: string;
  questId: string;
  title: string; // snapshot of quest title
  points: number; // snapshot of quest points
  assignedAt: string; // ISO
  active: boolean;
};
