import { useState, useEffect } from 'react';
import { heroRepository } from '@data/repositories/heroRepository';
import type { Hero } from './heroTypes';
import { formatDatabaseError } from '../utils/errorMessages';

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

  const loadHero = async () => {
    try {
      setLoading(true);
      const heroData = await heroRepository.initializeDefaultHero();
      setHero(heroData);
      setError(null);
    } catch (err) {
      setError(formatDatabaseError('loading hero', err));
      setHero(null);
    } finally {
      setLoading(false);
    }
  };

  const updateHero = async (updates: Partial<Hero>) => {
    if (!hero) return;
    
    try {
      await heroRepository.update(hero.id, updates);
      const updatedHero = { ...hero, ...updates };
      setHero(updatedHero);
    } catch (err) {
      setError(formatDatabaseError('updating hero', err));
    }
  };

  const refreshHero = async () => {
    await loadHero();
  };

  useEffect(() => {
    loadHero();
  }, []);

  return {
    hero,
    loading,
    error,
    updateHero,
    refreshHero
  };
}
