import { useState, useEffect } from 'react';
import { pointRequestRepository } from '../data/repositories/pointRequestRepository';
import type { PointRequest } from '../types/pointRequestTypes';

type PointRequestHook = {
  pointRequests: PointRequest[];
  loading: boolean;
  error: string | null;
  createPointRequest: (request: Omit<PointRequest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updatePointRequestStatus: (id: string, status: 'approved' | 'declined') => Promise<void>;
  refreshPointRequests: (heroId?: string) => Promise<void>;
};

export function usePointRequests(heroId?: string): PointRequestHook {
  const [pointRequests, setPointRequests] = useState<PointRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPointRequests = async () => {
    try {
      setLoading(true);
      let requests: PointRequest[];
      
      if (heroId) {
        requests = await pointRequestRepository.getByHeroId(heroId);
      } else {
        requests = await pointRequestRepository.getAll();
      }
      
      setPointRequests(requests);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load point requests');
      setPointRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const createPointRequest = async (request: Omit<PointRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const id = await pointRequestRepository.create({ ...request, status: 'pending' });
      await loadPointRequests();
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create point request');
      throw err;
    }
  };

  const updatePointRequestStatus = async (id: string, status: 'approved' | 'declined'): Promise<void> => {
    try {
      await pointRequestRepository.updateStatus(id, status);
      await loadPointRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${status} point request`);
      throw err;
    }
  };

  const refreshPointRequests = async (heroId?: string) => {
    try {
      setLoading(true);
      let requests: PointRequest[];
      
      if (heroId) {
        requests = await pointRequestRepository.getByHeroId(heroId);
      } else {
        requests = await pointRequestRepository.getAll();
      }
      
      setPointRequests(requests);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh point requests');
      setPointRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPointRequests();
  }, [heroId]);

  return {
    pointRequests,
    loading,
    error,
    createPointRequest,
    updatePointRequestStatus,
    refreshPointRequests
  };
}