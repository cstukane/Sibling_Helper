// This is a simple API client that wraps our services
// In a real implementation, this would make HTTP requests to a backend server
// For now, it directly uses our services since we're using a client-side database

import { pointRequestService } from '../services/pointRequestService';
import { questService } from '../services/questService';
import { heroService } from '../services/heroService';
import { boardService } from '../services/boardService';
import type { PointRequest } from '../types/pointRequestTypes';
import type { Quest } from '../types/questTypes';
import type { Hero } from '../types/heroTypes';

export const apiClient = {
  // Point Request endpoints
  pointRequests: {
    create: (data: Omit<PointRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => 
      pointRequestService.createPointRequest(data),
    
    approve: (id: string) => 
      pointRequestService.approvePointRequest(id),
      
    decline: (id: string) => 
      pointRequestService.declinePointRequest(id),
      
    getPending: () => 
      pointRequestService.getPendingRequests()
  },

  // Quest endpoints
  quests: {
    getAll: () => 
      questService.getAllQuests(),
      
    getActive: () => 
      questService.getActiveQuests(),
      
    getRecurringChores: () => 
      questService.getRecurringChores(),
      
    create: (data: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>) => 
      questService.createQuest(data),
      
    update: (id: string, updates: Partial<Quest>) => 
      questService.updateQuest(id, updates),
      
    delete: (id: string) => 
      questService.deleteQuest(id)
  },

  // Hero endpoints
  heroes: {
    getAll: () => 
      heroService.getAllHeroes(),
      
    getById: (id: string) => 
      heroService.getHeroById(id),
      
    create: (data: Omit<Hero, 'id' | 'createdAt' | 'updatedAt'>) => 
      heroService.createHero(data),
      
    update: (id: string, updates: Partial<Hero>) => 
      heroService.updateHero(id, updates),
      
    delete: (id: string) => 
      heroService.deleteHero(id)
  },

  // Board endpoints
  board: {
    getByDate: (date: string) => 
      boardService.getBoardItemsByDate(date),
      
    getByHeroAndDate: (heroId: string, date: string) => 
      boardService.getBoardItemsByHeroAndDate(heroId, date),
      
    markCompleted: (boardItemId: string) => 
      boardService.markQuestCompleted(boardItemId),
      
    generateDaily: (heroId: string, date: string, questIds: string[]) => 
      boardService.generateDailyBoard(heroId, date, questIds)
  }
};
