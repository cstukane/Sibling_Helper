import { pointRequestRepository } from '../data/repositories/pointRequestRepository';
import type { PointRequest } from '../types/pointRequestTypes';

export const pointRequestService = {
  async createPointRequest(data: Omit<PointRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
    try {
      return await pointRequestRepository.create({
        ...data,
        status: 'pending'
      });
    } catch (error) {
      console.error('Error creating point request:', error);
      throw error;
    }
  },

  async approvePointRequest(id: string): Promise<void> {
    try {
      await pointRequestRepository.updateStatus(id, 'approved');
    } catch (error) {
      console.error(`Error approving point request ${id}:`, error);
      throw error;
    }
  },

  async declinePointRequest(id: string): Promise<void> {
    try {
      await pointRequestRepository.updateStatus(id, 'declined');
    } catch (error) {
      console.error(`Error declining point request ${id}:`, error);
      throw error;
    }
  },

  async getPendingRequests(): Promise<PointRequest[]> {
    try {
      return await pointRequestRepository.getPendingRequests();
    } catch (error) {
      console.error('Error getting pending requests:', error);
      throw error;
    }
  }
};