export interface Reminder {
  id: string;
  text: string;
  time: string;
  member: string;
  completed: boolean;
  category: 'medication' | 'shopping' | 'general' | 'appointment';
}

export interface Chore {
  id: string;
  title: string;
  assignee: string;
  points: number;
  completed: boolean;
  dueDate: string;
}

export interface GiftIdea {
  id: string;
  recipient: string;
  ideas: string[];
  date: string;
}

export interface VaultSecret {
  id: string;
  title: string;
  type: 'wifi' | 'policy' | 'medical' | 'other';
  secret: string;
  note?: string;
  lastUpdated: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  member: string;
  category: 'family' | 'school' | 'medical' | 'social';
}

export interface SOSStatus {
  id: string;
  name: string;
  status: 'safe' | 'assistance';
  timestamp: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  message?: string;
}

export interface FamilyMember {
  name: string;
  role: string;
  avatar: string;
}

export interface NotificationItem {
  id: string;
  text: string;
  timestamp: string;
  read: boolean;
  level: 'info' | 'warning' | 'emergency';
}

export interface FamilyState {
  reminders: Reminder[];
  chores: Chore[];
  vaultSecrets: VaultSecret[];
  calendarEvents: CalendarEvent[];
  sosStatuses: SOSStatus[];
  notifications: NotificationItem[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
  approved: boolean;
  avatar?: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  assignee_id: number;
  assignee_name?: string;
  created_by: number;
  due_date: string;
  completed: boolean;
  points: number;
  category: string;
  created_at: string;
}

export interface FamilyCall {
  id: number;
  caller_id: number;
  caller_name?: string;
  callee_id: number;
  callee_name?: string;
  status: 'pending' | 'active' | 'ended';
  created_at: string;
}