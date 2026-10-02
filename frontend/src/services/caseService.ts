import { api } from './api';
import {
  Match,
  Case,
  Meeting,
  HandoverToken,
  Message,
  Dispute,
  Notification,
} from '../types';

export const caseService = {
  getMatchesForLost: async (lostId: number): Promise<Match[]> => {
    const res = await api.get(`/matches/lost/${lostId}`);
    return res.data;
  },

  getMatchesForFound: async (foundId: number): Promise<Match[]> => {
    const res = await api.get(`/matches/found/${foundId}`);
    return res.data;
  },

  requestVerification: async (lost_item_id: number, found_item_id: number): Promise<Case> => {
    const res = await api.post('/matches/request', {
      lost_item_id,
      found_item_id,
    });
    return res.data;
  },

  getMyCases: async (): Promise<Case[]> => {
    const res = await api.get('/cases/my');
    return res.data;
  },

  getCaseDetail: async (caseId: number): Promise<Case> => {
    const res = await api.get(`/cases/${caseId}`);
    return res.data;
  },

  confirmFinderPossession: async (caseId: number, has_possession: boolean): Promise<Case> => {
    const res = await api.post(`/cases/${caseId}/finder-possession`, { has_possession });
    return res.data;
  },

  setVerificationChallenge: async (caseId: number, finder_question: string): Promise<Case> => {
    const res = await api.post(`/cases/${caseId}/verification-challenge`, { finder_question });
    return res.data;
  },

  submitVerificationAnswer: async (caseId: number, owner_answer: string): Promise<Case> => {
    const res = await api.post(`/cases/${caseId}/verification-answer`, { owner_answer });
    return res.data;
  },

  decideVerification: async (caseId: number, is_accepted: boolean): Promise<Case> => {
    const res = await api.post(`/cases/${caseId}/verification-decision`, { is_accepted });
    return res.data;
  },

  proposeMeeting: async (
    caseId: number,
    data: { location_id: number; scheduled_time: string; notes?: string }
  ): Promise<Meeting> => {
    const res = await api.post(`/meetings/${caseId}`, data);
    return res.data;
  },

  respondToMeeting: async (
    caseId: number,
    data: { action: 'ACCEPT' | 'REJECT' | 'RESCHEDULE' | 'CANCEL'; new_time?: string; new_location_id?: number; notes?: string }
  ): Promise<Meeting> => {
    const res = await api.post(`/meetings/${caseId}/respond`, data);
    return res.data;
  },

  getHandoverToken: async (caseId: number): Promise<HandoverToken> => {
    const res = await api.get(`/handover/${caseId}/token`);
    return res.data;
  },

  confirmHandover: async (
    caseId: number,
    token_code: string,
    role_confirmation: 'HANDED_OVER' | 'RECEIVED'
  ) => {
    const res = await api.post(`/handover/${caseId}/confirm`, {
      token_code,
      role_confirmation,
    });
    return res.data;
  },

  getMessages: async (caseId: number): Promise<Message[]> => {
    const res = await api.get(`/chat/${caseId}/messages`);
    return res.data;
  },

  sendMessage: async (caseId: number, content: string): Promise<Message> => {
    const res = await api.post(`/chat/${caseId}/messages`, { content });
    return res.data;
  },

  fileDispute: async (data: { case_id: number; reason: string; description: string }): Promise<Dispute> => {
    const res = await api.post('/disputes/', data);
    return res.data;
  },

  getMyDisputes: async (): Promise<Dispute[]> => {
    const res = await api.get('/disputes/my');
    return res.data;
  },

  getNotifications: async (): Promise<Notification[]> => {
    const res = await api.get('/notifications/');
    return res.data;
  },

  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    const res = await api.get('/notifications/unread-count');
    return res.data;
  },

  markNotificationRead: async (notifId: number): Promise<void> => {
    await api.put(`/notifications/${notifId}/read`);
  },

  markAllNotificationsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },
};
