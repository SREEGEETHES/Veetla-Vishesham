export type Language = 'en' | 'ta';

export type Screen = 'home' | 'vault' | 'sos' | 'shared' | 'speak';

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'master' | 'member';
  relationship: string;
  avatar: string;
  phone?: string;
  telegramUsername?: string;
  callMeBotApiKey?: string;
  language?: Language;
  password?: string;
}

export interface AppConfig {
  callMeBotApiKey: string;
  telegramUsername: string;
  telegramPhone: string;
  geminiApiKey: string;
  familyName: string;
}

export interface ReminderItem {
  id: string;
  title: string;
  time: string;
  targetTimestamp?: number;
  callTimestamp?: number;
  assignee: string;
  status: 'pending' | 'completed';
  category: 'medication' | 'shopping' | 'chore' | 'general';
  method: 'call' | 'notification';
  isCalled?: boolean;
}

export interface VaultDocument {
  id: string;
  name: string;
  size: string;
  bytes: number;
  dateAdded: string;
  type: 'pdf' | 'image' | 'text';
  category: 'id' | 'travel' | 'medical' | 'home';
  previewUrl?: string;
  encryptedHash: string;
  uploadedBy?: string;
}

export interface FamilyMember {
  id: string;
  username?: string;
  name: string;
  role: 'master' | 'member';
  relationship: string;
  language: 'English' | 'Tamil' | 'Telugu';
  avatar: string;
  phone?: string;
  password?: string;
}

export interface MilestoneEvent {
  id: string;
  title: string;
  personNames?: string;
  date: string;
  daysRemaining: string;
  type: 'anniversary' | 'birthday' | 'visit' | 'rule' | 'home';
  description: string;
  assignee?: string;
  image?: string;
  actionLabel?: string;
  isMandatory?: boolean;
}

export interface MemoryItem {
  id: string;
  caption: string;
  date: string;
  imageUrl: string;
  uploadedBy: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'alert' | 'call' | 'reminder' | 'security';
  read: boolean;
}
