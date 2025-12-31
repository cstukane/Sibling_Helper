import { useState, useEffect, useRef } from 'react';
import { heroRepository } from '@data/repositories/heroRepository';
import type { Hero } from './heroTypes';
import { formatDatabaseError } from '../utils/errorMessages';
import { cacheKeys, cacheTtlMs, loadCachedState, saveCachedState, clearCachedState } from './stateCache';
import { clampNumber, sanitizeOptionalText, sanitizeText } from './stateValidation';

type HeroHook = {
  hero: Hero | null;
  loading: boolean;
  error: string | null;
  updateHero: (updates: Partial<Hero>) => Promise<void>;
  refreshHero: () => Promise<void>;
};

export function useHero(): HeroHook {
  const [hero, setHero] = useState<Hero | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const heroRef = useRef<Hero | null>(null);

  const loadHero = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
      const heroData = await heroRepository.initializeDefaultHero();
      setHero(heroData);
      setError(null);
    } catch (err) {
      setError(formatDatabaseError('loading hero', err));
      setHero(null);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  const updateHero = async (updates: Partial<Hero>) => {
    const currentHero = heroRef.current;
    if (!currentHero) return;
    const sanitizedUpdates: Partial<Hero> = { ...updates };

    if (updates.name !== undefined) {
      const name = sanitizeText(updates.name, 40);
      if (!name) {
        setError('Hero name is required.');
        return;
      }
      sanitizedUpdates.name = name;
    }

    if (updates.avatarUrl !== undefined) {
      sanitizedUpdates.avatarUrl = sanitizeOptionalText(updates.avatarUrl, 200);
    }

    if (updates.progressionPoints !== undefined) {
      sanitizedUpdates.progressionPoints = clampNumber(updates.progressionPoints, 0, 100000);
    }

    if (updates.rewardPoints !== undefined) {
      sanitizedUpdates.rewardPoints = clampNumber(updates.rewardPoints, 0, 100000);
    }

    if (updates.streakDays !== undefined) {
      sanitizedUpdates.streakDays = clampNumber(updates.streakDays, 0, 10000);
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return;
    }

    const optimisticHero = { ...currentHero, ...sanitizedUpdates };
    setHero(optimisticHero);
    
    try {
      await heroRepository.update(currentHero.id, sanitizedUpdates);
      setError(null);
    } catch (err) {
      setHero(currentHero);
      setError(formatDatabaseError('updating hero', err));
    }
  };

  const refreshHero = async () => {
    await loadHero();
  };

  useEffect(() => {
    heroRef.current = hero;
  }, [hero]);

  useEffect(() => {
    const cachedHero = loadCachedState<Hero>(cacheKeys.hero, cacheTtlMs.hero);
    if (cachedHero) {
      setHero(cachedHero);
      setLoading(false);
    }
    loadHero({ silent: !!cachedHero });
  }, []);

  useEffect(() => {
    if (hero) {
      saveCachedState(cacheKeys.hero, hero);
    } else {
      clearCachedState(cacheKeys.hero);
    }
  }, [hero]);

  return {
    hero,
    loading,
    error,
    updateHero,
    refreshHero
  };
}
