// This is a simple API client that wraps our services
// In a real implementation, this would make HTTP requests to a backend server
// For now, it directly uses our services since we're using a client-side database

import { pointRequestService } from '../services/pointRequestService';
import { questService } from '../services/questService';
import { heroService } from '../services/heroService';
import { boardService } from '../services/boardService';
import { cachedCall, withRetry } from './serviceReliability';
import type { PointRequest } from '../types/pointRequestTypes';
import type { Quest } from '../types/questTypes';
import type { Hero } from '../types/heroTypes';

export const apiClient = {
  // Point Request endpoints
  pointRequests: {
    create: (data: Omit<PointRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => 
      withRetry('create point request', () => pointRequestService.createPointRequest(data)),
    
    approve: (id: string) => 
      withRetry('approve point request', () => pointRequestService.approvePointRequest(id)),
      
    decline: (id: string) => 
      withRetry('decline point request', () => pointRequestService.declinePointRequest(id)),
      
    getPending: () => 
      cachedCall('pointRequests:pending', 5000, () => pointRequestService.getPendingRequests())
  },

  // Quest endpoints
  quests: {
    getAll: () => 
      cachedCall('quests:all', 5000, () => questService.getAllQuests()),
      
    getActive: () => 
      cachedCall('quests:active', 5000, () => questService.getActiveQuests()),
      
    getRecurringChores: () => 
      cachedCall('quests:recurring', 5000, () => questService.getRecurringChores()),
      
    create: (data: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>) => 
      withRetry('create quest', () => questService.createQuest(data)),
      
    update: (id: string, updates: Partial<Quest>) => 
      withRetry('update quest', () => questService.updateQuest(id, updates)),
      
    delete: (id: string) => 
      withRetry('delete quest', () => questService.deleteQuest(id))
  },

  // Hero endpoints
  heroes: {
    getAll: () => 
      cachedCall('heroes:all', 5000, () => heroService.getAllHeroes()),
      
    getById: (id: string) => 
      cachedCall(`heroes:${id}`, 5000, () => heroService.getHeroById(id)),
      
    create: (data: Omit<Hero, 'id' | 'createdAt' | 'updatedAt'>) => 
      withRetry('create hero', () => heroService.createHero(data)),
      
    update: (id: string, updates: Partial<Hero>) => 
      withRetry('update hero', () => heroService.updateHero(id, updates)),
      
    delete: (id: string) => 
      withRetry('delete hero', () => heroService.deleteHero(id))
  },

  // Board endpoints
  board: {
    getByDate: (date: string) => 
      cachedCall(`board:date:${date}`, 5000, () => boardService.getBoardItemsByDate(date)),
      
    getByHeroAndDate: (heroId: string, date: string) => 
      cachedCall(`board:${heroId}:${date}`, 5000, () => boardService.getBoardItemsByHeroAndDate(heroId, date)),
      
    markCompleted: (boardItemId: string) => 
      withRetry('mark board item completed', () => boardService.markQuestCompleted(boardItemId)),
      
    generateDaily: (heroId: string, date: string, questIds: string[]) => 
      withRetry('generate daily board', () => boardService.generateDailyBoard(heroId, date, questIds))
  }
};
