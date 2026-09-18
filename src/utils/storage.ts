import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { User, AppConfig, ReminderItem, VaultDocument, MilestoneEvent, MemoryItem } from '../types';
import {
  INITIAL_USERS,
  INITIAL_CONFIG,
  INITIAL_REMINDERS,
  INITIAL_DOCUMENTS,
  INITIAL_MILESTONES,
  INITIAL_MEMORIES
} from '../data/mockData';

// Storage collection keys
const USERS_COLLECTION = 'users';
const SETTINGS_DOC = 'settings/app_config';
const REMINDERS_COLLECTION = 'reminders';
const DOCUMENTS_COLLECTION = 'documents';
const EVENTS_COLLECTION = 'events';
const MEMORIES_COLLECTION = 'memories';

// Sync Users
export async function fetchUsers(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    if (snap.empty) {
      for (const u of INITIAL_USERS) {
        await setDoc(doc(db, USERS_COLLECTION, u.id), u);
      }
      return INITIAL_USERS;
    }
    return snap.docs.map((d) => d.data() as User);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
    const cached = localStorage.getItem('familyos_users');
    return cached ? JSON.parse(cached) : INITIAL_USERS;
  }
}

export async function saveUserToDb(user: User): Promise<void> {
  try {
    await setDoc(doc(db, USERS_COLLECTION, user.id), user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${USERS_COLLECTION}/${user.id}`);
  }
}

export async function deleteUserFromDb(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${USERS_COLLECTION}/${userId}`);
  }
}

// Sync AppConfig / API Keys
export async function fetchAppConfig(): Promise<AppConfig> {
  try {
    const ref = doc(db, 'settings', 'app_config');
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, INITIAL_CONFIG);
      return INITIAL_CONFIG;
    }
    return snap.data() as AppConfig;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, SETTINGS_DOC);
    const cached = localStorage.getItem('familyos_config');
    return cached ? JSON.parse(cached) : INITIAL_CONFIG;
  }
}

export async function saveAppConfigToDb(config: AppConfig): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'app_config'), config);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, SETTINGS_DOC);
  }
}

// Sync Reminders
export async function fetchReminders(): Promise<ReminderItem[]> {
  try {
    const snap = await getDocs(collection(db, REMINDERS_COLLECTION));
    if (snap.empty) {
      return [];
    }
    return snap.docs.map((d) => d.data() as ReminderItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, REMINDERS_COLLECTION);
    const cached = localStorage.getItem('familyos_reminders');
    return cached ? JSON.parse(cached) : [];
  }
}

export async function saveReminderToDb(reminder: ReminderItem): Promise<void> {
  try {
    await setDoc(doc(db, REMINDERS_COLLECTION, reminder.id), reminder);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${REMINDERS_COLLECTION}/${reminder.id}`);
  }
}

export async function deleteReminderFromDb(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, REMINDERS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${REMINDERS_COLLECTION}/${id}`);
  }
}

// Sync Documents
export async function fetchDocuments(): Promise<VaultDocument[]> {
  try {
    const snap = await getDocs(collection(db, DOCUMENTS_COLLECTION));
    if (snap.empty) {
      return [];
    }
    return snap.docs.map((d) => d.data() as VaultDocument);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, DOCUMENTS_COLLECTION);
    const cached = localStorage.getItem('familyos_documents');
    return cached ? JSON.parse(cached) : [];
  }
}

export async function saveDocumentToDb(docItem: VaultDocument): Promise<void> {
  try {
    await setDoc(doc(db, DOCUMENTS_COLLECTION, docItem.id), docItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${DOCUMENTS_COLLECTION}/${docItem.id}`);
  }
}

export async function deleteDocumentFromDb(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, DOCUMENTS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${DOCUMENTS_COLLECTION}/${id}`);
  }
}

// Sync Events (Birthdays & Anniversaries set by Master Admin)
export async function fetchEvents(): Promise<MilestoneEvent[]> {
  try {
    const snap = await getDocs(collection(db, EVENTS_COLLECTION));
    if (snap.empty) {
      return [];
    }
    return snap.docs.map((d) => d.data() as MilestoneEvent);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, EVENTS_COLLECTION);
    const cached = localStorage.getItem('familyos_milestones');
    return cached ? JSON.parse(cached) : [];
  }
}

export async function saveEventToDb(event: MilestoneEvent): Promise<void> {
  try {
    await setDoc(doc(db, EVENTS_COLLECTION, event.id), event);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${EVENTS_COLLECTION}/${event.id}`);
  }
}

export async function deleteEventFromDb(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, EVENTS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${EVENTS_COLLECTION}/${id}`);
  }
}

// Sync Memories
export async function fetchMemories(): Promise<MemoryItem[]> {
  try {
    const snap = await getDocs(collection(db, MEMORIES_COLLECTION));
    if (snap.empty) {
      return [];
    }
    return snap.docs.map((d) => d.data() as MemoryItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, MEMORIES_COLLECTION);
    const cached = localStorage.getItem('familyos_memories');
    return cached ? JSON.parse(cached) : [];
  }
}

export async function saveMemoryToDb(memory: MemoryItem): Promise<void> {
  try {
    await setDoc(doc(db, MEMORIES_COLLECTION, memory.id), memory);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${MEMORIES_COLLECTION}/${memory.id}`);
  }
}

export async function deleteMemoryFromDb(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, MEMORIES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${MEMORIES_COLLECTION}/${id}`);
  }
}
