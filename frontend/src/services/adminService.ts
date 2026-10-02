import { api } from './api';
import { Analytics, User, Category, CampusLocation, Dispute, AuditLog } from '../types';

export const adminService = {
  getAnalytics: async (): Promise<Analytics> => {
    const res = await api.get('/admin/analytics');
    return res.data;
  },

  listUsers: async (params?: { search?: string; role?: string; is_suspended?: boolean }): Promise<User[]> => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  updateUser: async (
    userId: number,
    data: { role?: string; is_suspended?: boolean; is_verified?: boolean; badges?: string[] }
  ): Promise<User> => {
    const res = await api.put(`/admin/users/${userId}`, data);
    return res.data;
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await api.get('/admin/categories');
    return res.data;
  },

  createCategory: async (data: { name: string; icon: string; is_active?: boolean }): Promise<Category> => {
    const res = await api.post('/admin/categories', data);
    return res.data;
  },

  getLocations: async (): Promise<CampusLocation[]> => {
    const res = await api.get('/admin/locations');
    return res.data;
  },

  createLocation: async (data: {
    name: string;
    zone_code: string;
    description?: string;
    map_x: number;
    map_y: number;
    is_meeting_point: boolean;
  }): Promise<CampusLocation> => {
    const res = await api.post('/admin/locations', data);
    return res.data;
  },

  getSettings: async () => {
    const res = await api.get('/admin/settings');
    return res.data;
  },

  updateSetting: async (key: string, value: string, description?: string) => {
    const res = await api.put('/admin/settings', { key, value, description });
    return res.data;
  },

  getAuditLogs: async (skip = 0, limit = 100): Promise<AuditLog[]> => {
    const res = await api.get('/admin/audit-logs', { params: { skip, limit } });
    return res.data;
  },

  listDisputes: async (status_filter = 'OPEN'): Promise<Dispute[]> => {
    const res = await api.get('/disputes/', { params: { status_filter } });
    return res.data;
  },

  resolveDispute: async (
    disputeId: number,
    data: { resolution: string; admin_notes: string; suspend_user_id?: number }
  ): Promise<Dispute> => {
    const res = await api.put(`/disputes/${disputeId}/resolve`, data);
    return res.data;
  },
};
