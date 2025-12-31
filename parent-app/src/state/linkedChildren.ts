import { useState, useEffect } from 'react';
import type { LinkedChild } from './linkedChildTypes';
import { cacheKeys, cacheTtlMs, loadCachedState, saveCachedState } from './stateCache';
import { clampNumber, sanitizeOptionalText, sanitizeText } from './stateValidation';

type LinkedChildrenHook = {
  linkedChildren: LinkedChild[];
  loading: boolean;
  error: string | null;
  linkChild: (childData: Omit<LinkedChild, 'id' | 'lastSyncedAt'>) => Promise<void>;
  unlinkChild: (childId: string) => Promise<void>;
  updateChild: (childId: string, updates: Partial<LinkedChild>) => Promise<void>;
  refreshLinkedChildren: () => Promise<void>;
};

const LINKED_CHILDREN_KEY = 'linked_children';

const sanitizePin = (pin: string) => pin.replace(/\D/g, '').slice(0, 6);

export function useLinkedChildren(): LinkedChildrenHook {
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLinkedChildren = async () => {
    try {
      setLoading(true);
      const cached = loadCachedState<LinkedChild[]>(cacheKeys.linkedChildren, cacheTtlMs.linkedChildren);
      if (cached) {
        setLinkedChildren(cached);
        setError(null);
        setLoading(false);
        return;
      }
      const stored = localStorage.getItem(LINKED_CHILDREN_KEY);
      const children = stored ? JSON.parse(stored) : [];
      setLinkedChildren(children);
      saveCachedState(cacheKeys.linkedChildren, children);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load linked children');
      setLinkedChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const linkChild = async (childData: Omit<LinkedChild, 'id' | 'lastSyncedAt'>) => {
    try {
      const name = sanitizeText(childData.name, 40);
      if (!name) {
        setError('Child name is required.');
        return;
      }
      const childId = sanitizeText(childData.childId, 40);
      if (!childId) {
        setError('Child ID is required.');
        return;
      }
      const pin = sanitizePin(childData.pin);
      if (pin.length < 4) {
        setError('Child PIN must be at least 4 digits.');
        return;
      }

      const newChild: LinkedChild = {
        ...childData,
        childId,
        name,
        avatarUrl: sanitizeOptionalText(childData.avatarUrl, 200),
        currentPoints: clampNumber(childData.currentPoints, 0, 100000),
        pin,
        id: Math.random().toString(36).substr(2, 9), // Simple ID generation
        lastSyncedAt: new Date().toISOString()
      };
      
      const updatedChildren = [...linkedChildren, newChild];
      setLinkedChildren(updatedChildren);
      localStorage.setItem(LINKED_CHILDREN_KEY, JSON.stringify(updatedChildren));
      saveCachedState(cacheKeys.linkedChildren, updatedChildren);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link child');
    }
  };

  const unlinkChild = async (childId: string) => {
    try {
      const updatedChildren = linkedChildren.filter(child => child.childId !== childId);
      setLinkedChildren(updatedChildren);
      localStorage.setItem(LINKED_CHILDREN_KEY, JSON.stringify(updatedChildren));
      saveCachedState(cacheKeys.linkedChildren, updatedChildren);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink child');
    }
  };

  const updateChild = async (childId: string, updates: Partial<LinkedChild>) => {
    try {
      const sanitizedUpdates: Partial<LinkedChild> = { ...updates };
      if (updates.name !== undefined) {
        const name = sanitizeText(updates.name, 40);
        if (!name) {
          setError('Child name is required.');
          return;
        }
        sanitizedUpdates.name = name;
      }
      if (updates.avatarUrl !== undefined) {
        sanitizedUpdates.avatarUrl = sanitizeOptionalText(updates.avatarUrl, 200);
      }
      if (updates.currentPoints !== undefined) {
        sanitizedUpdates.currentPoints = clampNumber(updates.currentPoints, 0, 100000);
      }
      if (updates.pin !== undefined) {
        const pin = sanitizePin(updates.pin);
        if (pin.length < 4) {
          setError('Child PIN must be at least 4 digits.');
          return;
        }
        sanitizedUpdates.pin = pin;
      }

      const updatedChildren = linkedChildren.map(child => 
        child.childId === childId ? { ...child, ...sanitizedUpdates, lastSyncedAt: new Date().toISOString() } : child
      );
      setLinkedChildren(updatedChildren);
      localStorage.setItem(LINKED_CHILDREN_KEY, JSON.stringify(updatedChildren));
      saveCachedState(cacheKeys.linkedChildren, updatedChildren);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update child');
    }
  };

  const refreshLinkedChildren = async () => {
    await loadLinkedChildren();
  };

  useEffect(() => {
    loadLinkedChildren();
  }, []);

  return {
    linkedChildren,
    loading,
    error,
    linkChild,
    unlinkChild,
    updateChild,
    refreshLinkedChildren
  };
}
