import { api } from './api';
import { LostItem, FoundItem, Category, CampusLocation } from '../types';

export const itemService = {
  getCategories: async (): Promise<Category[]> => {
    const res = await api.get('/admin/categories');
    return res.data;
  },

  getLocations: async (): Promise<CampusLocation[]> => {
    const res = await api.get('/meetings/locations');
    return res.data;
  },

  checkDuplicate: async (data: {
    title: string;
    category_id: number;
    location_id: number;
    item_date: string;
    is_lost_report: boolean;
  }) => {
    const res = await api.post('/lost/check-duplicate', data);
    return res.data;
  },

  reportLost: async (data: Partial<LostItem>, force = false): Promise<LostItem> => {
    const res = await api.post(`/lost/?force=${force}`, data);
    return res.data;
  },

  reportFound: async (data: Partial<FoundItem>, force = false): Promise<FoundItem> => {
    const res = await api.post(`/found/?force=${force}`, data);
    return res.data;
  },

  searchLost: async (params?: { search?: string; category_id?: number; location_id?: number }): Promise<LostItem[]> => {
    const res = await api.get('/lost/', { params });
    return res.data;
  },

  searchFound: async (params?: { search?: string; category_id?: number; location_id?: number }): Promise<FoundItem[]> => {
    const res = await api.get('/found/', { params });
    return res.data;
  },

  getMyLost: async (): Promise<LostItem[]> => {
    const res = await api.get('/lost/my');
    return res.data;
  },

  getMyFound: async (): Promise<FoundItem[]> => {
    const res = await api.get('/found/my');
    return res.data;
  },

  getLostById: async (id: number): Promise<LostItem> => {
    const res = await api.get(`/lost/${id}`);
    return res.data;
  },

  getFoundById: async (id: number): Promise<FoundItem> => {
    const res = await api.get(`/found/${id}`);
    return res.data;
  },

  getCampusZonesActivity: async () => {
    const res = await api.get('/map/zones');
    return res.data;
  },
};
