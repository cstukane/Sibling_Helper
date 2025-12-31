import { db } from './db';
import type { Hero } from '@state/heroTypes';
import type { Quest } from '@state/questTypes';
import type { DailyBoardItem } from '@state/boardTypes';
import type { Reward } from '@state/rewardTypes';
import type { Redemption } from '@state/redemptionTypes';
import { executeDbOperation } from './dbOperations';
import { formatDatabaseError } from '../utils/errorMessages';

type DatabaseBackupData = {
  heroes: Hero[];
  quests: Quest[];
  board: DailyBoardItem[];
  rewards: Reward[];
  redemptions: Redemption[];
};

export type DatabaseBackup = {
  version: number;
  timestamp: string;
  data: DatabaseBackupData;
};

const BACKUP_STORAGE_KEY = 'sibling-helper-db-backup';
const BACKUP_VERSION = 1;
let backupTimer: number | null = null;

const hasStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export async function exportDatabase(): Promise<DatabaseBackup> {
  const data = await executeDbOperation('exporting database', async () => {
    const [heroes, quests, board, rewards, redemptions] = await Promise.all([
      db.heroes.toArray(),
      db.quests.toArray(),
      db.board.toArray(),
      db.rewards.toArray(),
      db.redemptions.toArray()
    ]);
    return { heroes, quests, board, rewards, redemptions };
  });

  return {
    version: BACKUP_VERSION,
    timestamp: new Date().toISOString(),
    data
  };
}

export async function saveBackupToStorage(): Promise<void> {
  if (!hasStorage()) return;
  const backup = await exportDatabase();
  localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backup));
}

export function loadBackupFromStorage(): DatabaseBackup | null {
  if (!hasStorage()) return null;
  const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as DatabaseBackup;
    if (!parsed?.data) return null;
    return parsed;
  } catch (error) {
    console.error(formatDatabaseError('reading database backup', error), error);
    return null;
  }
}

export async function restoreDatabaseFromBackup(backup: DatabaseBackup): Promise<void> {
  await executeDbOperation('restoring database', async () => {
    await db.transaction('rw', [db.heroes, db.quests, db.board, db.rewards, db.redemptions], async () => {
      await Promise.all([
        db.heroes.clear(),
        db.quests.clear(),
        db.board.clear(),
        db.rewards.clear(),
        db.redemptions.clear()
      ]);

      await Promise.all([
        db.heroes.bulkAdd(backup.data.heroes),
        db.quests.bulkAdd(backup.data.quests),
        db.board.bulkAdd(backup.data.board),
        db.rewards.bulkAdd(backup.data.rewards),
        db.redemptions.bulkAdd(backup.data.redemptions)
      ]);
    });
  });
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await executeDbOperation(
      'checking database health',
      () =>
        db.transaction('r', [db.heroes, db.quests, db.board, db.rewards, db.redemptions], async () => {
          await Promise.all([
            db.heroes.count(),
            db.quests.count(),
            db.board.count(),
            db.rewards.count(),
            db.redemptions.count()
          ]);
        }),
      { retries: 0 }
    );
    return true;
  } catch (error) {
    console.error(formatDatabaseError('checking database health', error), error);
    return false;
  }
}

export async function recoverDatabaseIfCorrupt(): Promise<boolean> {
  const healthy = await checkDatabaseHealth();
  if (healthy) return true;

  const backup = loadBackupFromStorage();
  if (!backup) return false;

  try {
    await restoreDatabaseFromBackup(backup);
    return true;
  } catch (error) {
    console.error(formatDatabaseError('restoring database backup', error), error);
    return false;
  }
}

export function queueBackup(): void {
  if (!hasStorage()) return;
  if (backupTimer !== null) return;
  backupTimer = window.setTimeout(async () => {
    backupTimer = null;
    try {
      await saveBackupToStorage();
    } catch (error) {
      console.error(formatDatabaseError('saving database backup', error), error);
    }
  }, 600);
}
