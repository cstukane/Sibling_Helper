import Dexie, { type EntityTable } from 'dexie';
import type { Hero } from '../types/heroTypes';
import type { Quest } from '../types/questTypes';
import type { DailyBoardItem } from '../types/boardTypes';
import type { Reward } from '../types/rewardTypes';
import type { Redemption } from '../types/redemptionTypes';
import type { PointRequest } from '../types/pointRequestTypes';

interface DatabaseSchema {
  heroes: Hero;
  quests: Quest;
  board: DailyBoardItem;
  rewards: Reward;
  redemptions: Redemption;
  pointRequests: PointRequest;
}

class SiblingHelperDB extends Dexie {
  heroes!: EntityTable<Hero, 'id'>;
  quests!: EntityTable<Quest, 'id'>;
  board!: EntityTable<DailyBoardItem, 'id'>;
  rewards!: EntityTable<Reward, 'id'>;
  redemptions!: EntityTable<Redemption, 'id'>;
  pointRequests!: EntityTable<PointRequest, 'id'>;

  constructor() {
    super('SiblingHelperDB');
    this.version(2).stores({
      heroes: 'id, name, points, streakDays, createdAt, updatedAt',
      quests: 'id, title, category, points, active, createdAt, updatedAt',
      board: 'id, questId, date, heroId, completedAt',
      rewards: 'id, title, cost, active',
      redemptions: 'id, heroId, rewardId, pointsSpent, redeemedAt',
      pointRequests: 'id, heroId, questId, status, createdAt, updatedAt'
    });
  }
}

const db = new SiblingHelperDB();

export type { DatabaseSchema };
export { db };