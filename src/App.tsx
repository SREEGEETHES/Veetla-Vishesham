import { useState, useEffect } from "react";
import Header from "./components/Header";
import HomeView from "./components/HomeView";
import SharedView from "./components/SharedView";
import SpeakView from "./components/SpeakView";
import VaultView from "./components/VaultView";
import SOSView from "./components/SOSView";
import { FamilyState, Reminder, Chore, CalendarEvent, VaultSecret, SOSStatus } from "./types";
import { Home, Users, Mic, Shield, AlertTriangle } from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState(0); // 0: Home, 1: Shared, 2: Speak, 3: Vault, 4: SOS
  
  // Entire synced full-stack state
  const [state, setState] = useState<FamilyState>({
    reminders: [],
    chores: [],
    vaultSecrets: [],
    calendarEvents: [],
    sosStatuses: [],
    notifications: []
  });

  const [loading, setLoading] = useState(true);

  // Load state from full-stack Express local DB on component rise
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/data");
        if (res.ok) {
          const data = await res.json();
          setState(data);
        }
      } catch (err) {
        console.error("Failed to fetch full-stack family store", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Update back-end state synchronously
  const storeState = async (newState: FamilyState) => {
    setState(newState);
    try {
      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newState)
      });
    } catch (err) {
      console.error("Fail saving back-end state", err);
    }
  };

  // --- ACTIONS HANDLERS ---

  // Reminders / grocery toggle
  const handleToggleReminder = (id: string) => {
    const updated = state.reminders.map((rem) => 
      rem.id === id ? { ...rem, completed: !rem.completed } : rem
    );
    const text = state.reminders.find(r => r.id === id)?.text;
    const isCompleted = !state.reminders.find(r => r.id === id)?.completed;
    
    // Add brief info alert on finished tasks
    let notifications = [...state.notifications];
    if (isCompleted) {
      notifications.unshift({
        id: "not-" + Date.now(),
        text: `Great! "${text}" has been checked off.`,
        timestamp: "Just now",
        read: false,
        level: "info"
      });
    }

    storeState({
      ...state,
      reminders: updated,
      notifications
    });
  };

  const handleAddReminder = (item: Omit<Reminder, "id" | "completed">) => {
    const newRem: Reminder = {
      ...item,
      id: "rem-" + Date.now(),
      completed: false
    };
    storeState({
      ...state,
      reminders: [...state.reminders, newRem]
    });
  };

  const handleDeleteReminder = (id: string) => {
    storeState({
      ...state,
      reminders: state.reminders.filter((rem) => rem.id !== id)
    });
  };

  // Chores scoreboard
  const handleToggleChore = (id: string) => {
    const updated = state.chores.map((cho) => 
      cho.id === id ? { ...cho, completed: !cho.completed } : cho
    );
    const choreObj = state.chores.find(c => c.id === id);
    const isCompleted = !choreObj?.completed;

    let notifications = [...state.notifications];
    if (isCompleted && choreObj) {
      notifications.unshift({
        id: "not-" + Date.now(),
        text: `${choreObj.assignee} scored +${choreObj.points} Points for completing: "${choreObj.title}"!`,
        timestamp: "Just now",
        read: false,
        level: "info"
      });
    }

    storeState({
      ...state,
      chores: updated,
      notifications
    });
  };

  const handleAddChore = (chore: Omit<Chore, "id">) => {
    const newChore: Chore = {
      ...chore,
      id: "cho-" + Date.now()
    };
    storeState({
      ...state,
      chores: [...state.chores, newChore]
    });
  };

  const handleDeleteChore = (id: string) => {
    storeState({
      ...state,
      chores: state.chores.filter((cho) => cho.id !== id)
    });
  };

  // Calendar meetups
  const handleAddCalendarEvent = (event: Omit<CalendarEvent, "id">) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: "cal-" + Date.now()
    };
    storeState({
      ...state,
      calendarEvents: [...state.calendarEvents, newEvent]
    });
  };

  const handleDeleteCalendarEvent = (id: string) => {
    storeState({
      ...state,
      calendarEvents: state.calendarEvents.filter((evt) => evt.id !== id)
    });
  };

  // Secrets locking records
  const handleAddSecret = (secret: Omit<VaultSecret, "id" | "lastUpdated">) => {
    const newSec: VaultSecret = {
      ...secret,
      id: "sec-" + Date.now(),
      lastUpdated: "Updated Just now"
    };
    storeState({
      ...state,
      vaultSecrets: [...state.vaultSecrets, newSec],
      notifications: [
        {
          id: "not-" + Date.now(),
          text: `New encryption record safely written to Locked Vault: "${secret.title}"`,
          timestamp: "Just now",
          read: false,
          level: "info"
        },
        ...state.notifications
      ]
    });
  };

  const handleDeleteSecret = (id: string) => {
    storeState({
      ...state,
      vaultSecrets: state.vaultSecrets.filter((sec) => sec.id !== id)
    });
  };

  // SOS Distress Beacons logging
  const handleAddSOSStatus = (status: Omit<SOSStatus, "id" | "timestamp">) => {
    const newSOS: SOSStatus = {
      ...status,
      id: "sos-" + Date.now(),
      timestamp: "Just now"
    };

    let notifications = [...state.notifications];
    if (status.status === "assistance") {
      notifications.unshift({
        id: "not-" + Date.now(),
        text: `⚠️ CRITICAL: SOS Beacon initiated by ${status.name}! Coordinates dispatched.`,
        timestamp: "Emergency",
        read: false,
        level: "emergency"
      });
      // also redirect instantly to SOS panic panel so family immediately realizes!
      setCurrentTab(4); 
    }

    storeState({
      ...state,
      sosStatuses: [newSOS, ...state.sosStatuses],
      notifications
    });
  };

  const handleClearSOS = () => {
    storeState({
      ...state,
      sosStatuses: []
    });
  };

  // Notification items
  const handleMarkNotificationRead = (id: string) => {
    const updated = state.notifications.map((not) =>
      not.id === id ? { ...not, read: true } : not
    );
    storeState({
      ...state,
      notifications: updated
    });
  };

  const handleClearNotifications = () => {
    storeState({
      ...state,
      notifications: []
    });
  };

  // --- GEMINI PROXY HANDLERS ---

  const handleGenerateGiftSuggestions = async (query: string, recipient: string) => {
    try {
      const response = await fetch("/api/ai/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, recipient })
      });
      if (response.ok) {
        const res = await response.json();
        return res.ideas || [];
      }
    } catch (err) {
      console.error(err);
    }
    return [];
  };

  // approving parsed detail from SpeakView
  const handleAddParsedItem = (type: 'reminder' | 'chore' | 'calendar', data: any) => {
    let reminders = [...state.reminders];
    let chores = [...state.chores];
    let calendarEvents = [...state.calendarEvents];

    if (type === "reminder") {
      reminders.push({
        id: "rem-" + Date.now(),
        text: data.text || "Generic voice reminder",
        time: data.time || "12:00 PM",
        member: data.member || "Everyone",
        completed: false,
        category: data.category || "general"
      });
    } else if (type === "chore") {
      chores.push({
        id: "cho-" + Date.now(),
        title: data.title || "Voice Chore",
        assignee: data.assignee || "Dad",
        points: data.points || 15,
        completed: false,
        dueDate: data.dueDate || "Tomorrow"
      });
    } else if (type === "calendar") {
      calendarEvents.push({
        id: "cal-" + Date.now(),
        title: data.title || "Vibe Appointment",
        date: data.date || "2026-06-20",
        time: data.time || "4:00 PM",
        member: data.member || "Everyone",
        category: data.category || "family"
      });
    }

    const notifications = [
      {
        id: "not-" + Date.now(),
        text: `Gemini parsed and integrated dynamic ${type} successfully!`,
        timestamp: "Just now",
        read: false,
        level: "info" as const
      },
      ...state.notifications
    ];

    storeState({
      ...state,
      reminders,
      chores,
      calendarEvents,
      notifications
    });
  };

  // Rendering loading state nicely
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <svg className="animate-spin h-10 w-10 text-[#dc8e47] mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm font-bold text-slate-600">Powering FamilyOS Core...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9f9] text-[#1a1c1c] font-sans min-h-screen pb-24 text-center selection:bg-orange-100 flex flex-col justify-between">
      
      {/* Universal top navigation and notification popovers */}
      <Header 
        notifications={state.notifications}
        onMarkRead={handleMarkNotificationRead}
        onClearNotifications={handleClearNotifications}
      />

      {/* Primary viewport render box */}
      <main className="flex-1 w-full max-w-lg mx-auto">
        {currentTab === 0 && (
          <HomeView 
            reminders={state.reminders}
            onToggleReminder={handleToggleReminder}
            onNavigateToTab={setCurrentTab}
            onGenerateGiftSuggestions={handleGenerateGiftSuggestions}
          />
        )}

        {currentTab === 1 && (
          <SharedView 
            chores={state.chores}
            calendarEvents={state.calendarEvents}
            reminders={state.reminders}
            onToggleChore={handleToggleChore}
            onAddChore={handleAddChore}
            onDeleteChore={handleDeleteChore}
            onAddCalendarEvent={handleAddCalendarEvent}
            onDeleteCalendarEvent={handleDeleteCalendarEvent}
            onAddReminder={handleAddReminder}
            onDeleteReminder={handleDeleteReminder}
            onToggleReminder={handleToggleReminder}
          />
        )}

        {currentTab === 2 && (
          <SpeakView 
            onAddParsedItem={handleAddParsedItem}
          />
        )}

        {currentTab === 3 && (
          <VaultView 
            secrets={state.vaultSecrets}
            onAddSecret={handleAddSecret}
            onDeleteSecret={handleDeleteSecret}
          />
        )}

        {currentTab === 4 && (
          <SOSView 
            sosStatuses={state.sosStatuses}
            onAddSOSStatus={handleAddSOSStatus}
            onClearSOS={handleClearSOS}
          />
        )}
      </main>

      {/* Floating Bottom Navigation (replicated from high contrast mockups) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#d8c2b3]/40 shadow-lg py-2 rounded-t-2xl max-w-lg mx-auto">
        <div className="flex justify-around items-center px-4 w-full">
          
          {/* Home */}
          <button 
            onClick={() => setCurrentTab(0)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
              currentTab === 0 
                ? "bg-[#ffdcc2] text-[#8e4e08] font-bold px-4 scale-102" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Home className="w-5.5 h-5.5" />
            <span className="text-[10px] mt-0.5 tracking-wide">Home</span>
          </button>

          {/* Shared */}
          <button 
            onClick={() => setCurrentTab(1)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
              currentTab === 1 
                ? "bg-[#ffdcc2] text-[#8e4e08] font-bold px-4 scale-102" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-5.5 h-5.5" />
            <span className="text-[10px] mt-0.5 tracking-wide">Space</span>
          </button>

          {/* Speak */}
          <button 
            onClick={() => setCurrentTab(2)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
              currentTab === 2 
                ? "bg-[#ffdcc2] text-[#8e4e08] font-bold px-4 scale-102 animate-pulse" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Mic className="w-5.5 h-5.5" />
            <span className="text-[10px] mt-0.5 tracking-wide">Speak</span>
          </button>

          {/* Vault */}
          <button 
            onClick={() => setCurrentTab(3)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
              currentTab === 3 
                ? "bg-[#ffdcc2] text-[#8e4e08] font-bold px-4 scale-102" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Shield className="w-5.5 h-5.5" />
            <span className="text-[10px] mt-0.5 tracking-wide">Vault</span>
          </button>

          {/* SOS Emergency */}
          <button 
            onClick={() => setCurrentTab(4)}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all font-bold cursor-pointer ${
              currentTab === 4 
                ? "bg-red-600 text-white shadow-md shadow-red-200" 
                : "text-[#ba1a1a] hover:bg-red-50/50"
            }`}
          >
            <AlertTriangle className="w-5.5 h-5.5" />
            <span className="text-[10px] mt-0.5">SOS</span>
          </button>

        </div>
      </nav>

    </div>
  );
}
