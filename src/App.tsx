import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Mic,
  Calendar,
  FolderLock,
  PhoneCall,
  CheckCircle2,
  Bell,
  Clock,
  Send,
  AlertTriangle,
  User as UserIcon,
  Shield
} from 'lucide-react';

import {
  Screen,
  Language,
  User,
  AppConfig,
  ReminderItem,
  VaultDocument,
  MilestoneEvent,
  MemoryItem,
  SystemNotification
} from './types';

import {
  INITIAL_USERS,
  INITIAL_CONFIG,
  INITIAL_REMINDERS,
  INITIAL_DOCUMENTS,
  INITIAL_MILESTONES,
  INITIAL_MEMORIES
} from './data/mockData';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeDashboard } from './components/HomeDashboard';
import { DocumentVault } from './components/DocumentVault';
import { EmergencySOS } from './components/EmergencySOS';
import { FamilyEvents } from './components/FamilyEvents';
import { VoiceRecorderModal } from './components/VoiceRecorderModal';
import { MasterAdminConsole } from './components/MasterAdminConsole';
import { IncomingCallModal } from './components/IncomingCallModal';
import { ProfileModal } from './components/ProfileModal';
import { MemoriesModal } from './components/MemoriesModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { AddReminderModal } from './components/AddReminderModal';
import { LoginPage } from './components/LoginPage';

import {
  saveUserToDb,
  deleteUserFromDb,
  saveAppConfigToDb,
  saveReminderToDb,
  saveDocumentToDb,
  deleteDocumentFromDb,
  saveEventToDb,
  deleteEventFromDb,
  fetchUsers,
  fetchAppConfig,
  fetchReminders,
  fetchDocuments,
  fetchEvents,
  fetchMemories,
  saveMemoryToDb
} from './utils/storage';
import { soundCtrl } from './utils/audio';
import { dispatchTelegramCall } from './utils/callService';

export default function App() {
  // Navigation & Language
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('familyos_lang');
    return saved === 'ta' ? 'ta' : 'en';
  });

  // Dedicated URL-based Admin Routing (/admin or #admin)
  const checkIsAdminPath = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path.endsWith('/admin') ||
      path.endsWith('/admin/') ||
      hash === '#admin' ||
      hash.startsWith('#/admin') ||
      search.includes('admin=true')
    );
  };

  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(checkIsAdminPath);

  // Sync route on popstate / hashchange / URL navigation
  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminRoute(checkIsAdminPath());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handleCloseAdminRoute = () => {
    setIsAdminRoute(false);
    try {
      const cleanPath = window.location.pathname.replace(/\/admin\/?$/, '') || '/';
      window.history.pushState(null, '', cleanPath);
    } catch {}
  };

  // Users & Authentication
  const [users, setUsers] = useState<User[]>(() => {
    const cached = localStorage.getItem('familyos_users');
    return cached ? JSON.parse(cached) : INITIAL_USERS;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('familyos_is_logged_in') === 'true';
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const isAuth = localStorage.getItem('familyos_is_logged_in') === 'true';
    if (!isAuth) return null;
    const cached = localStorage.getItem('familyos_current_user');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  // Application Config & API Keys
  const [appConfig, setAppConfig] = useState<AppConfig>(() => {
    const cached = localStorage.getItem('familyos_config');
    return cached ? JSON.parse(cached) : INITIAL_CONFIG;
  });

  // Reminders & Chores
  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    const cached = localStorage.getItem('familyos_reminders');
    return cached ? JSON.parse(cached) : INITIAL_REMINDERS;
  });

  // Document Vault (<2MB each)
  const [documents, setDocuments] = useState<VaultDocument[]>(() => {
    const cached = localStorage.getItem('familyos_documents');
    return cached ? JSON.parse(cached) : INITIAL_DOCUMENTS;
  });

  // Family Events & Mandatory Milestones
  const [milestones, setMilestones] = useState<MilestoneEvent[]>(() => {
    const cached = localStorage.getItem('familyos_milestones');
    return cached ? JSON.parse(cached) : INITIAL_MILESTONES;
  });

  // Family Memories Photo Album
  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    const cached = localStorage.getItem('familyos_memories');
    return cached ? JSON.parse(cached) : INITIAL_MEMORIES;
  });

  // Notifications Drawer
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: 'notif-1',
      title: 'FamilyOS Active',
      message: 'Personal automated calls enabled with emotional voice tone.',
      time: 'Just now',
      type: 'reminder',
      read: false
    }
  ]);

  // Modals visibility state
  const [isSpeakOpen, setIsSpeakOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMemoriesOpen, setIsMemoriesOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);

  // Incoming Telegram Automated Call State
  const [incomingCallState, setIncomingCallState] = useState<{
    isOpen: boolean;
    reminderId?: string;
    reminderTitle: string;
    assigneeName: string;
  }>({
    isOpen: false,
    reminderTitle: '',
    assigneeName: ''
  });

  // Cron loop countdown for next check
  const [cronSecondsRemaining, setCronSecondsRemaining] = useState<number>(60);
  const dispatchedCallIdsRef = useRef<Set<string>>(new Set());

  // 1. Initialize data from Firestore Database
  useEffect(() => {
    async function initData() {
      try {
        const [dbUsers, dbConfig, dbReminders, dbDocs, dbEvents, dbMemories] = await Promise.all([
          fetchUsers(),
          fetchAppConfig(),
          fetchReminders(),
          fetchDocuments(),
          fetchEvents(),
          fetchMemories()
        ]);

        if (dbUsers?.length) {
          setUsers(dbUsers);
          localStorage.setItem('familyos_users', JSON.stringify(dbUsers));

          // Ensure logged-in member session is preserved across PWA restarts with latest database details
          const savedUserId = localStorage.getItem('familyos_user_id');
          const wasAuth = localStorage.getItem('familyos_is_logged_in') === 'true';
          if (wasAuth && savedUserId) {
            const matchedUser = dbUsers.find((u) => u.id === savedUserId);
            if (matchedUser) {
              setCurrentUser(matchedUser);
              setIsLoggedIn(true);
              localStorage.setItem('familyos_current_user', JSON.stringify(matchedUser));
            }
          }
        }
        if (dbConfig) {
          setAppConfig(dbConfig);
          localStorage.setItem('familyos_config', JSON.stringify(dbConfig));
        }
        if (dbReminders) {
          setReminders(dbReminders);
          localStorage.setItem('familyos_reminders', JSON.stringify(dbReminders));
        }
        if (dbDocs) {
          setDocuments(dbDocs);
          localStorage.setItem('familyos_documents', JSON.stringify(dbDocs));
        }
        if (dbEvents) {
          setMilestones(dbEvents);
          localStorage.setItem('familyos_milestones', JSON.stringify(dbEvents));
        }
        if (dbMemories) {
          setMemories(dbMemories);
          localStorage.setItem('familyos_memories', JSON.stringify(dbMemories));
        }
      } catch {
        // Silent fallback to local storage cache
      }
    }
    initData();
  }, []);

  // 2. Persist State Changes Locally
  useEffect(() => {
    localStorage.setItem('familyos_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      localStorage.setItem('familyos_current_user', JSON.stringify(currentUser));
      localStorage.setItem('familyos_user_id', currentUser.id);
      localStorage.setItem('familyos_is_logged_in', 'true');
    } else {
      localStorage.removeItem('familyos_current_user');
      localStorage.removeItem('familyos_user_id');
      localStorage.setItem('familyos_is_logged_in', 'false');
    }
  }, [isLoggedIn, currentUser]);

  useEffect(() => {
    localStorage.setItem('familyos_config', JSON.stringify(appConfig));
  }, [appConfig]);

  useEffect(() => {
    localStorage.setItem('familyos_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('familyos_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('familyos_milestones', JSON.stringify(milestones));
  }, [milestones]);

  useEffect(() => {
    localStorage.setItem('familyos_memories', JSON.stringify(memories));
  }, [memories]);

  // 3. Language preference toggle
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem('familyos_lang', newLang);
  };

  // 4. Automated Cron Loop (Checks every 60s for due chore calls)
  useEffect(() => {
    const cronInterval = setInterval(() => {
      setCronSecondsRemaining((prev) => {
        if (prev <= 1) {
          checkAndDispatchChoreCalls();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(cronInterval);
  }, [reminders, currentUser, appConfig, language]);

  // Core Dispatch Logic: Rings only individual user's personal phone/session
  const checkAndDispatchChoreCalls = () => {
    const now = Date.now();

    reminders.forEach((reminder) => {
      // Check if task is pending and not already called
      if (reminder.status === 'pending' && !reminder.isCalled) {
        const isAlreadyDispatched = dispatchedCallIdsRef.current.has(reminder.id);
        if (isAlreadyDispatched) return;

        // Verify scheduled trigger time
        const triggerTime = reminder.callTimestamp || reminder.targetTimestamp;
        const isDue = triggerTime ? now >= triggerTime - 60000 : false;

        // Strictly verify assignee matches current user or 'everyone'
        const isAssigneeForMe =
          reminder.assignee.toLowerCase() === 'everyone' ||
          reminder.assignee.toLowerCase() === currentUser?.name.toLowerCase();

        if (isDue && isAssigneeForMe) {
          dispatchedCallIdsRef.current.add(reminder.id);
          handleTriggerTelegramCall(reminder.id, reminder.title, reminder.assignee);
        }
      }
    });

    // Milestone Check: Everyone receives celebration voice call on that day
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    const todayShort = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    milestones.forEach((m) => {
      const isToday =
        m.date === todayIso ||
        m.date.toLowerCase().includes(todayShort.toLowerCase()) ||
        m.daysRemaining?.toLowerCase() === 'today';

      const milestoneKey = `milestone-${m.id}-${todayIso}`;
      if (isToday && !dispatchedCallIdsRef.current.has(milestoneKey)) {
        dispatchedCallIdsRef.current.add(milestoneKey);

        // Ring in-app celebration for active family member
        handleTriggerTelegramCall(
          undefined,
          `Family Milestone Celebration: ${m.title}!`,
          'Everyone'
        );

        // Broadcast automated voice call to every family member
        users.forEach((member) => {
          const target =
            member.telegramUsername ||
            member.phone ||
            appConfig.telegramUsername ||
            appConfig.telegramPhone;

          if (target) {
            dispatchTelegramCall({
              targetUserHandle: target,
              recipientName: member.name,
              choreTitle: `Family Celebration Today: ${m.title}!`,
              language: member.language || language,
              apiKey: member.callMeBotApiKey || appConfig.callMeBotApiKey || undefined
            });
          }
        });
      }
    });
  };

  // Trigger Telegram Voice Call (Incoming Modal + CallMeBot API)
  const handleTriggerTelegramCall = (
    reminderId?: string,
    title?: string,
    assignee?: string
  ) => {
    const choreTitle = title || 'Scheduled Household Chore';
    const assigneeName = assignee || currentUser?.name || 'Family Member';

    if (reminderId) {
      dispatchedCallIdsRef.current.add(reminderId);
      setReminders((prev) =>
        prev.map((r) => {
          if (r.id === reminderId && !r.isCalled) {
            const updated = { ...r, isCalled: true };
            saveReminderToDb(updated);
            return updated;
          }
          return r;
        })
      );
    }

    setIncomingCallState({
      isOpen: true,
      reminderId,
      reminderTitle: choreTitle,
      assigneeName
    });

    // Ring via Web Audio synthesizer
    soundCtrl.startIncomingCallRing();

    // Check if target user has their own Telegram handle/key, else fallback to household appConfig
    const targetUser = users.find(
      (u) => u.name.toLowerCase() === assigneeName.toLowerCase()
    );
    const effectiveApiKey = targetUser?.callMeBotApiKey || appConfig.callMeBotApiKey;
    const effectiveTarget =
      targetUser?.telegramUsername ||
      targetUser?.phone ||
      appConfig.telegramUsername ||
      appConfig.telegramPhone;

    if (effectiveTarget) {
      dispatchTelegramCall({
        targetUserHandle: effectiveTarget,
        recipientName: assigneeName,
        choreTitle,
        language,
        apiKey: effectiveApiKey || undefined
      }).then((res) => {
        const newNotif: SystemNotification = {
          id: 'notif-' + Date.now(),
          title: res.success ? 'Telegram Voice Call Dispatched' : 'Telegram Call Notice',
          message: res.message,
          time: 'Just now',
          type: res.success ? 'reminder' : 'alert',
          read: false
        };
        setNotifications((n) => [newNotif, ...n.slice(0, 9)]);
      });
    } else {
      const fallbackNotif: SystemNotification = {
        id: 'notif-' + Date.now(),
        title: 'Chore Ring Triggered',
        message: `In-app acoustic alarm ringing for "${choreTitle}". (To receive Telegram phone calls, link your Telegram in My Profile).`,
        time: 'Just now',
        type: 'reminder',
        read: false
      };
      setNotifications((n) => [fallbackNotif, ...n.slice(0, 9)]);
    }
  };

  // User Profile & Authentication Handlers
  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('familyos_current_user', JSON.stringify(user));
    localStorage.setItem('familyos_is_logged_in', 'true');
  };

  const handleLogOut = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('familyos_current_user');
    localStorage.setItem('familyos_is_logged_in', 'false');
    soundCtrl.playPreviewTone();
  };

  const handleUpdateProfile = (updated: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updated };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    saveUserToDb(updatedUser);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    saveUserToDb(updatedUser);
  };

  const handleOnboardUser = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
    saveUserToDb(newUser);
    const newNotif: SystemNotification = {
      id: 'notif-' + Date.now(),
      title: 'New Family Member Onboarded',
      message: `${newUser.name} (@${newUser.username}) added with PIN ${newUser.password}.`,
      time: 'Just now',
      type: 'security',
      read: false
    };
    setNotifications((n) => [newNotif, ...n.slice(0, 9)]);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    deleteUserFromDb(userId);
  };

  const handleUpdateAppConfig = (newConfig: AppConfig) => {
    setAppConfig(newConfig);
    saveAppConfigToDb(newConfig);
  };

  // Reminders Handlers (Toggling & Marking Complete from Call)
  const handleToggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = {
            ...r,
            status: (r.status === 'completed' ? 'pending' : 'completed') as 'pending' | 'completed'
          };
          saveReminderToDb(updated);
          return updated;
        }
        return r;
      })
    );
  };

  // When user marks complete in the incoming call modal
  const handleCompleteChoreFromCall = (reminderId?: string) => {
    if (reminderId) {
      setReminders((prev) =>
        prev.map((r) => {
          if (r.id === reminderId) {
            const updated = {
              ...r,
              status: 'completed' as const,
              isCalled: true
            };
            saveReminderToDb(updated);
            return updated;
          }
          return r;
        })
      );
    } else {
      const pendingMatch = reminders.find(
        (r) =>
          r.status === 'pending' &&
          (r.assignee.toLowerCase() === currentUser?.name.toLowerCase() ||
            r.assignee.toLowerCase() === 'everyone')
      );
      if (pendingMatch) {
        handleToggleReminder(pendingMatch.id);
      }
    }

    const completeNotif: SystemNotification = {
      id: 'notif-' + Date.now(),
      title: 'Chore Confirmed Completed',
      message: `Task confirmed and marked as completed via Telegram Voice Call.`,
      time: 'Just now',
      type: 'reminder',
      read: false
    };
    setNotifications((prev) => [completeNotif, ...prev]);

    setIncomingCallState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleAddReminder = (newRem: ReminderItem) => {
    setReminders((prev) => [newRem, ...prev]);
    saveReminderToDb(newRem);
    const newNotif: SystemNotification = {
      id: 'notif-' + Date.now(),
      title: 'Chore Scheduled',
      message: `${newRem.title} assigned to ${newRem.assignee} (${newRem.time}) via ${newRem.method.toUpperCase()}.`,
      time: 'Just now',
      type: 'reminder',
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Document Vault Handlers (<2MB limit enforced)
  const handleAddDocument = (newDoc: VaultDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);
    saveDocumentToDb(newDoc);
    const newNotif: SystemNotification = {
      id: 'notif-' + Date.now(),
      title: 'Document Saved in Vault',
      message: `${newDoc.name} (${newDoc.size}) uploaded by ${currentUser?.name || 'Member'}.`,
      time: 'Just now',
      type: 'security',
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    deleteDocumentFromDb(id);
    const newNotif: SystemNotification = {
      id: 'notif-' + Date.now(),
      title: 'Document Removed',
      message: `Document was permanently removed.`,
      time: 'Just now',
      type: 'alert',
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Family Events / Milestones Handlers (Persistent)
  const handleAddMilestone = (newEvent: MilestoneEvent) => {
    setMilestones((prev) => [newEvent, ...prev]);
    saveEventToDb(newEvent);
    const newNotif: SystemNotification = {
      id: 'notif-' + Date.now(),
      title: 'Persistent Milestone Scheduled',
      message: `${newEvent.title} on ${newEvent.date} saved to database.`,
      time: 'Just now',
      type: 'reminder',
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleDeleteMilestone = (eventId: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== eventId));
    deleteEventFromDb(eventId);
  };

  const handleAddMemory = (newMemory: MemoryItem) => {
    setMemories((prev) => [newMemory, ...prev]);
    saveMemoryToDb(newMemory);
    const newNotif: SystemNotification = {
      id: 'notif-' + Date.now(),
      title: 'Family Memory Added',
      message: `"${newMemory.caption}" saved to family album by ${newMemory.uploadedBy}.`,
      time: 'Just now',
      type: 'reminder',
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Screen Navigation
  const handleNavigation = (screen: Screen) => {
    if (screen === 'speak') {
      setIsSpeakOpen(true);
    } else {
      setCurrentScreen(screen);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // If user is not logged in, show Individual Login Page
  if (!isLoggedIn || !currentUser) {
    return (
      <LoginPage
        users={users}
        onSelectUser={handleSelectUser}
        language={language}
        onLanguageChange={handleLanguageChange}
      />
    );
  }

  // URL-BASED ADMIN ROUTING: /admin is ONLY accessible via URL
  if (isAdminRoute) {
    if (currentUser.role !== 'master') {
      return (
        <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4 shadow-xl">
            <Shield className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-black mb-2">Master Admin Access Required</h2>
          <p className="text-sm text-slate-400 max-w-sm mb-6">
            The URL <code className="text-amber-300 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700">/admin</code> is strictly reserved for the household Master Admin. You are signed in as <span className="text-white font-bold">{currentUser.name}</span> ({currentUser.relationship}).
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCloseAdminRoute}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              Back to Family Dashboard
            </button>
            <button
              type="button"
              onClick={handleLogOut}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer"
            >
              Sign In as Master Admin
            </button>
          </div>
        </div>
      );
    }

    return (
      <MasterAdminConsole
        users={users}
        currentUser={currentUser}
        appConfig={appConfig}
        milestones={milestones}
        language={language}
        onUpdateAppConfig={handleUpdateAppConfig}
        onOnboardUser={handleOnboardUser}
        onDeleteUser={handleDeleteUser}
        onUpdateUser={handleUpdateUser}
        onAddMilestone={handleAddMilestone}
        onDeleteMilestone={handleDeleteMilestone}
        onTriggerTelegramCall={(reminderId, title, assignee) =>
          handleTriggerTelegramCall(reminderId, title, assignee)
        }
        onClose={handleCloseAdminRoute}
      />
    );
  }

  // STANDARD USER VIEW (Admin page and button completely hidden from user page)
  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#1A0D0A] font-sans antialiased selection:bg-[#DC8E47] selection:text-white pb-6">
      {/* Top Header with Profile, EN/Tamil Switcher, and Test Call button */}
      <Header
        currentLanguage={language}
        onLanguageChange={handleLanguageChange}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenLogin={handleLogOut}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onTriggerTestCall={() => handleTriggerTelegramCall(undefined, 'Evening Medication Reminder', currentUser.name)}
        unreadNotifications={notifications.filter((n) => !n.read).length}
      />

      {/* Main Screens */}
      <div className="animate-in fade-in duration-200">
        {currentScreen === 'home' && (
          <HomeDashboard
            language={language}
            currentUser={currentUser}
            reminders={reminders}
            milestones={milestones}
            documents={documents}
            onToggleReminder={handleToggleReminder}
            onOpenSpeak={() => setIsSpeakOpen(true)}
            onOpenVault={() => setCurrentScreen('vault')}
            onOpenEvents={() => setCurrentScreen('shared')}
            onAddReminderModal={() => setIsAddReminderOpen(true)}
            onTriggerTestCall={(remId, msg, ass) => handleTriggerTelegramCall(remId, msg, ass)}
          />
        )}

        {currentScreen === 'vault' && (
          <DocumentVault
            language={language}
            documents={documents}
            currentUser={currentUser}
            onAddDocument={handleAddDocument}
            onDeleteDocument={handleDeleteDocument}
          />
        )}

        {currentScreen === 'sos' && (
          <EmergencySOS
            language={language}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'shared' && (
          <FamilyEvents
            language={language}
            milestones={milestones}
            currentUser={currentUser}
            onOpenSpeak={() => setIsSpeakOpen(true)}
            onOpenMemories={() => setIsMemoriesOpen(true)}
            onAddEvent={handleAddMilestone}
          />
        )}
      </div>

      {/* Kinetic Bottom Navigation Bar */}
      <BottomNav
        currentScreen={currentScreen}
        onNavigate={handleNavigation}
        language={language}
      />

      {/* Voice Chore Recorder Modal (Tamil & English Speech, Myself First Preference) */}
      <VoiceRecorderModal
        language={language}
        isOpen={isSpeakOpen}
        onClose={() => setIsSpeakOpen(false)}
        onSaveReminder={handleAddReminder}
        currentUser={currentUser}
        users={users}
      />

      {/* Incoming Telegram Automated Call Modal (With Emotional Voice & Mark Done Sync) */}
      <IncomingCallModal
        isOpen={incomingCallState.isOpen}
        reminderId={incomingCallState.reminderId}
        onAccept={() => {}}
        onDecline={() => setIncomingCallState((prev) => ({ ...prev, isOpen: false }))}
        onCompleteChore={(remId) => handleCompleteChoreFromCall(remId)}
        language={language}
        choreTitle={incomingCallState.reminderTitle}
        assigneeName={incomingCallState.assigneeName}
      />

      {/* Profile Management Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onUpdateProfile={handleUpdateProfile}
        onOpenLoginModal={handleLogOut}
        language={language}
      />

      {/* Family Memories Photo Album Modal */}
      <MemoriesModal
        isOpen={isMemoriesOpen}
        onClose={() => setIsMemoriesOpen(false)}
        memories={memories}
        currentUser={currentUser}
        onAddMemory={handleAddMemory}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onClearNotifications={() => setNotifications([])}
        onTriggerTestCall={() => {
          setIsNotificationsOpen(false);
          handleTriggerTelegramCall(undefined, 'Manual Test Alert Call', currentUser.name);
        }}
        cronSecondsRemaining={cronSecondsRemaining}
      />

      {/* Manual Add Reminder Modal (Myself First Preference) */}
      <AddReminderModal
        isOpen={isAddReminderOpen}
        onClose={() => setIsAddReminderOpen(false)}
        onAdd={handleAddReminder}
        language={language}
        currentUser={currentUser}
        users={users}
      />
    </div>
  );
}
