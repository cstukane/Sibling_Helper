import type { AssignedTask } from '../types/assignmentTypes';
import { getEnv } from './env';
import { apiRequest, startOfflineQueueProcessor } from '../api/request';

startOfflineQueueProcessor();

const LOCAL_KEY = 'assigned_tasks';

function readLocal(): AssignedTask[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as AssignedTask[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(items: AssignedTask[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

type AssignInput = { parentId: string; childId: string; questId: string; title: string; points: number };

export const taskAssignmentService = {
  async assign(input: AssignInput): Promise<AssignedTask> {
    const { parentId, childId, questId, title, points } = input;
    const { ENABLE_SYNC, API_BASE_URL } = getEnv();
    if (ENABLE_SYNC || API_BASE_URL) {
      try {
        return await apiRequest('/api/tasks/assign', {
          method: 'POST',
          body: JSON.stringify({ parentId, childId, questId, title, points })
        }, { queueIfOffline: true });
      } catch (e: any) {
        if (!e?.queued) throw e;
      }
    }
    const now = new Date().toISOString();
    const all = readLocal();
    const item: AssignedTask = { id: `assign_${Date.now()}_${Math.random().toString(36).slice(2,8)}`, parentId, childId, questId, title, points, assignedAt: now, active: true };
    writeLocal([item, ...all]);
    return item;
  },

  async listForChild(childId: string): Promise<AssignedTask[]> {
    const { ENABLE_SYNC, API_BASE_URL } = getEnv();
    if (ENABLE_SYNC || API_BASE_URL) {
      try {
        return await apiRequest(`/api/children/${encodeURIComponent(childId)}/tasks`, { method: 'GET' }, { cacheTtlMs: 5000 });
      } catch {
        return readLocal().filter((t) => t.childId === childId && t.active);
      }
    }
    return readLocal().filter((t) => t.childId === childId && t.active);
  },

  async listForParentChild(parentId: string, childId: string): Promise<AssignedTask[]> {
    const { ENABLE_SYNC, API_BASE_URL } = getEnv();
    if (ENABLE_SYNC || API_BASE_URL) {
      try {
        return await apiRequest(
          `/api/parents/${encodeURIComponent(parentId)}/children/${encodeURIComponent(childId)}/tasks`,
          { method: 'GET' },
          { cacheTtlMs: 5000 }
        );
      } catch {
        return readLocal().filter((t) => t.childId === childId && t.parentId === parentId && t.active);
      }
    }
    return readLocal().filter((t) => t.childId === childId && t.parentId === parentId && t.active);
  },

  async unassign(id: string): Promise<void> {
    const { ENABLE_SYNC, API_BASE_URL } = getEnv();
    if (ENABLE_SYNC || API_BASE_URL) {
      try {
        await apiRequest(`/api/tasks/${encodeURIComponent(id)}/unassign`, { method: 'POST' }, { queueIfOffline: true });
        return;
      } catch (e: any) {
        if (!e?.queued) throw e;
      }
    }
    const all = readLocal();
    writeLocal(all.map((t) => (t.id === id ? { ...t, active: false } : t)));
  },

  async migrateSnapshots(questMap: Record<string, { title: string; points: number }>, onlyMissing = true): Promise<{ updated: number }>{
    const { ENABLE_SYNC, API_BASE_URL } = getEnv();
    if (ENABLE_SYNC || API_BASE_URL) {
      try {
        return await apiRequest('/api/assignments/migrate', {
          method: 'POST',
          body: JSON.stringify({ questMap, onlyMissing })
        }, { queueIfOffline: true });
      } catch (e: any) {
        if (!e?.queued) throw e;
      }
    }
    // Local fallback: update local storage entries
    const all = readLocal();
    let updated = 0;
    const patched = all.map((t) => {
      const info = questMap[t.questId];
      if (!info) return t;
      const needs = onlyMissing ? (!t.title || typeof t.points !== 'number' || t.points === 0) : true;
      if (needs) {
        updated++;
        return { ...t, title: info.title, points: info.points };
      }
      return t;
    });
    writeLocal(patched);
    return { updated };
  },
};
