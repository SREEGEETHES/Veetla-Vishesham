export interface Reminder {
  id: number;
  text: string;
  time: string;
  member_name: string;
  member_id: number | null;
  completed: number;
  category: string;
  created_at: string;
}

export interface GiftIdea {
  id: string;
  recipient: string;
  ideas: string[];
  date: string;
}

export interface VaultSecret {
  id: number;
  title: string;
  type: string;
  secret: string;
  note?: string;
  created_at: string;
  owner_name?: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  member_name: string;
  category: string;
}

export interface SOSStatus {
  id: number;
  name: string;
  status: 'safe' | 'assistance';
  created_at: string;
  latitude?: number;
  longitude?: number;
  message?: string;
}

export interface FamilyMember {
  name: string;
  role: string;
  avatar: string;
}

export interface NotificationItem {
  id: number;
  text: string;
  created_at: string;
  read: number;
  level: string;
}

export interface FamilyState {
  reminders: Reminder[];
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