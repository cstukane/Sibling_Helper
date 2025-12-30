import type { AssignedTask } from '../types/assignmentTypes';
import { getEnv } from './env';

async function apiFetch(path: string, init?: RequestInit) {
  const { API_BASE_URL } = getEnv();
  const base = (API_BASE_URL || '').replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}${p}`;
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

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
      return apiFetch('/api/tasks/assign', { method: 'POST', body: JSON.stringify({ parentId, childId, questId, title, points }) });
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
      return apiFetch(`/api/children/${encodeURIComponent(childId)}/tasks`, { method: 'GET' });
    }
    return readLocal().filter((t) => t.childId === childId && t.active);
  },

  async listForParentChild(parentId: string, childId: string): Promise<AssignedTask[]> {
    const { ENABLE_SYNC, API_BASE_URL } = getEnv();
    if (ENABLE_SYNC || API_BASE_URL) {
      return apiFetch(`/api/parents/${encodeURIComponent(parentId)}/children/${encodeURIComponent(childId)}/tasks`, { method: 'GET' });
    }
    return readLocal().filter((t) => t.childId === childId && t.parentId === parentId && t.active);
  },

  async unassign(id: string): Promise<void> {
    const { ENABLE_SYNC, API_BASE_URL } = getEnv();
    if (ENABLE_SYNC || API_BASE_URL) {
      await apiFetch(`/api/tasks/${encodeURIComponent(id)}/unassign`, { method: 'POST' });
      return;
    }
    const all = readLocal();
    writeLocal(all.map((t) => (t.id === id ? { ...t, active: false } : t)));
  },

  async migrateSnapshots(questMap: Record<string, { title: string; points: number }>, onlyMissing = true): Promise<{ updated: number }>{
    const { ENABLE_SYNC, API_BASE_URL } = getEnv();
    if (ENABLE_SYNC || API_BASE_URL) {
      return apiFetch('/api/assignments/migrate', { method: 'POST', body: JSON.stringify({ questMap, onlyMissing }) });
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
