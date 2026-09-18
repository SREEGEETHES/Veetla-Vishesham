import { ReminderItem, VaultDocument, User, MilestoneEvent, SystemNotification, AppConfig, MemoryItem } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-master',
    username: 'admin',
    name: 'Master Admin',
    role: 'master',
    relationship: 'Family Administrator',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    phone: '',
    language: 'en',
    password: 'master2026'
  }
];

export const INITIAL_CONFIG: AppConfig = {
  callMeBotApiKey: '',
  telegramUsername: '',
  telegramPhone: '',
  geminiApiKey: '',
  familyName: 'My Family'
};

// Clean real slate - No simulated dummy data
export const INITIAL_REMINDERS: ReminderItem[] = [];

export const INITIAL_DOCUMENTS: VaultDocument[] = [];

export const INITIAL_MILESTONES: MilestoneEvent[] = [];

export const INITIAL_MEMORIES: MemoryItem[] = [];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [];
