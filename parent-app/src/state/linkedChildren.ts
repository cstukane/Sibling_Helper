import { useState, useEffect } from 'react';
import type { LinkedChild } from './linkedChildTypes';

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

export function useLinkedChildren(): LinkedChildrenHook {
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLinkedChildren = async () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem(LINKED_CHILDREN_KEY);
      const children = stored ? JSON.parse(stored) : [];
      setLinkedChildren(children);
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
      const newChild: LinkedChild = {
        ...childData,
        id: Math.random().toString(36).substr(2, 9), // Simple ID generation
        lastSyncedAt: new Date().toISOString()
      };
      
      const updatedChildren = [...linkedChildren, newChild];
      setLinkedChildren(updatedChildren);
      localStorage.setItem(LINKED_CHILDREN_KEY, JSON.stringify(updatedChildren));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link child');
    }
  };

  const unlinkChild = async (childId: string) => {
    try {
      const updatedChildren = linkedChildren.filter(child => child.childId !== childId);
      setLinkedChildren(updatedChildren);
      localStorage.setItem(LINKED_CHILDREN_KEY, JSON.stringify(updatedChildren));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink child');
    }
  };

  const updateChild = async (childId: string, updates: Partial<LinkedChild>) => {
    try {
      const updatedChildren = linkedChildren.map(child => 
        child.childId === childId ? { ...child, ...updates, lastSyncedAt: new Date().toISOString() } : child
      );
      setLinkedChildren(updatedChildren);
      localStorage.setItem(LINKED_CHILDREN_KEY, JSON.stringify(updatedChildren));
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