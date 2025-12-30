import { db } from '../db';
import type { PointRequest } from '../../types/pointRequestTypes';
import { heroRepository } from './heroRepository';

export const pointRequestRepository = {
  async getAll(): Promise<PointRequest[]> {
    try {
      return await db.pointRequests.toArray();
    } catch (error) {
      console.error('Error getting all point requests:', error);
      return [];
    }
  },

  async getById(id: string): Promise<PointRequest | undefined> {
    try {
      return await db.pointRequests.get(id);
    } catch (error) {
      console.error(`Error getting point request by id ${id}:`, error);
      return undefined;
    }
  },

  async getByHeroId(heroId: string): Promise<PointRequest[]> {
    try {
      return await db.pointRequests.where('heroId').equals(heroId).toArray();
    } catch (error) {
      console.error(`Error getting point requests for hero ${heroId}:`, error);
      return [];
    }
  },

  async getPendingRequests(): Promise<PointRequest[]> {
    try {
      return await db.pointRequests.where('status').equals('pending').toArray();
    } catch (error) {
      console.error('Error getting pending point requests:', error);
      return [];
    }
  },

  async create(request: Omit<PointRequest, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<string> {
    try {
      const id = request.id || `point-request-${Date.now()}`;
      const now = new Date().toISOString();
      
      const requestToSave: PointRequest = {
        id,
        heroId: request.heroId,
        questId: request.questId,
        points: request.points,
        title: request.title,
        description: request.description,
        status: request.status,
        createdAt: now,
        updatedAt: now,
        approvedAt: request.approvedAt,
        declinedAt: request.declinedAt
      };

      await db.pointRequests.add(requestToSave);
      return id;
    } catch (error) {
      console.error('Error creating point request:', error);
      throw error;
    }
  },

  async updateStatus(id: string, status: 'approved' | 'declined'): Promise<void> {
    try {
      const now = new Date().toISOString();
      const updates: Partial<PointRequest> = { 
        status, 
        updatedAt: now 
      };
      
      if (status === 'approved') {
        updates.approvedAt = now;
      } else if (status === 'declined') {
        updates.declinedAt = now;
      }
      
      await db.pointRequests.update(id, updates);
      
      // If approved, add points to the hero
      if (status === 'approved') {
        const request = await this.getById(id);
        if (request) {
          await heroRepository.addRewardPoints(request.heroId, request.points);
          // Also add progression points
          await heroRepository.addProgressionPoints(request.heroId, request.points);
        }
      }
    } catch (error) {
      console.error(`Error updating point request ${id} status:`, error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.pointRequests.delete(id);
    } catch (error) {
      console.error(`Error deleting point request ${id}:`, error);
      throw error;
    }
  }
};
