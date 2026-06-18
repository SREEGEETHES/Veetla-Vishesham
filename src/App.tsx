import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Header from "./components/Header";
import HomeView from "./components/HomeView";
import SharedView from "./components/SharedView";
import SpeakView from "./components/SpeakView";
import TasksView from "./components/TasksView";
import CallsView from "./components/CallsView";
import VaultView from "./components/VaultView";
import NotificationsView from "./components/NotificationsView";
import SOSView from "./components/SOSView";
import AuthScreen from "./components/AuthScreen";
import PendingApproval from "./components/PendingApproval";
import SettingsView from "./components/SettingsView";
import AdminPanel from "./components/AdminPanel";
import { SOSStatus } from "./types";
import {
  Home,
  Users,
  Mic,
  ClipboardList,
  Phone,
  Shield,
  Bell,
  AlertTriangle,
  Settings,
} from "lucide-react";

function AppShell() {
  const { user, isApproved, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
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

  // Not authenticated
  if (!user) {
    return <AuthScreen />;
  }

  // Authenticated but not yet approved
  if (!isApproved) {
    return (
      <>
        <Header />
        <PendingApproval />
      </>
    );
  }

  // Authenticated and approved — render the full app
  return (
    <AuthenticatedApp
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
    />
  );
}

interface AuthenticatedAppProps {
  currentTab: number;
  setCurrentTab: (tab: number) => void;
}

function AuthenticatedApp({ currentTab, setCurrentTab }: AuthenticatedAppProps) {
  const [showAdmin, setShowAdmin] = useState(false);
  const [sosStatuses, setSosStatuses] = useState<SOSStatus[]>([]);

  // --- ACTIONS HANDLERS ---

  const handleAddSOSStatus = (status: Omit<SOSStatus, "id" | "timestamp">) => {
    const newSOS: SOSStatus = {
      ...status,
      id: "sos-" + Date.now(),
      timestamp: "Just now",
    };

    if (status.status === "assistance") {
      setCurrentTab(7);
    }

    setSosStatuses(prev => [newSOS, ...prev]);
  };

  const handleClearSOS = () => {
    setSosStatuses([]);
  };

  const handleGenerateGiftSuggestions = async (query: string, recipient: string) => {
    try {
      const response = await fetch("/api/ai/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, recipient }),
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

  const handleAddParsedItem = async (type: 'reminder' | 'chore' | 'calendar', data: any) => {
    const token = localStorage.getItem("familyos_token") ?? "";

    try {
      if (type === "reminder") {
        await fetch("/api/reminders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: data.text || "Generic voice reminder",
            time: data.time || "12:00 PM",
            category: data.category || "general",
            member_id: null,
          }),
        });
      } else if (type === "chore") {
        await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: data.title || "Voice Chore",
            description: "",
            assignee_id: null,
            due_date: "",
            points: data.points || 10,
            category: "general",
          }),
        });
      } else if (type === "calendar") {
        await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: data.title || "Vibe Appointment",
            date: data.date || "2026-06-20",
            time: data.time || "4:00 PM",
            category: "family",
            member_id: null,
          }),
        });
      }
    } catch (err) {
      console.error("Failed to add parsed item", err);
    }
  };

  if (showAdmin) {
    return (
      <div className="bg-[#f9f9f9] text-[#1a1c1c] font-sans min-h-screen pb-24 text-center selection:bg-orange-100 flex flex-col">
        <Header />
        <main className="flex-1 w-full max-w-lg mx-auto">
          <button
            onClick={() => setShowAdmin(false)}
            className="text-xs text-slate-500 hover:text-[#8e4e08] mt-4 ml-4 flex items-center gap-1"
          >
            ← Back to app
          </button>
          <AdminPanel />
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9f9] text-[#1a1c1c] font-sans min-h-screen pb-28 text-center selection:bg-orange-100 flex flex-col justify-between">

      {/* Universal top navigation and notification popovers */}
      <Header />

      {/* Primary viewport render box */}
      <main className="flex-1 w-full max-w-lg mx-auto">
        {currentTab === 0 && (
          <HomeView
            onNavigateToTab={setCurrentTab}
            onGenerateGiftSuggestions={handleGenerateGiftSuggestions}
          />
        )}

        {currentTab === 1 && <SharedView />}

        {currentTab === 2 && (
          <SpeakView onAddParsedItem={handleAddParsedItem} />
        )}

        {currentTab === 3 && <TasksView />}

        {currentTab === 4 && <CallsView />}

        {currentTab === 5 && <VaultView />}

        {currentTab === 6 && <NotificationsView />}

        {currentTab === 7 && (
          <SOSView
            sosStatuses={sosStatuses}
            onAddSOSStatus={handleAddSOSStatus}
            onClearSOS={handleClearSOS}
          />
        )}

        {currentTab === 8 && (
          <SettingsView onNavigateToAdmin={() => setShowAdmin(true)} />
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#d8c2b3]/40 shadow-lg py-2 rounded-t-2xl max-w-lg mx-auto">
        <div className="flex justify-around items-center px-1 w-full overflow-x-auto">
          {/* Home */}
          <NavButton tab={0} currentTab={currentTab} onClick={setCurrentTab} icon={<Home className="w-5 h-5" />} label="Home" />

          {/* Shared */}
          <NavButton tab={1} currentTab={currentTab} onClick={setCurrentTab} icon={<Users className="w-5 h-5" />} label="Space" />

          {/* Speak */}
          <NavButton tab={2} currentTab={currentTab} onClick={setCurrentTab} icon={<Mic className="w-5 h-5" />} label="Speak" activePulse />

          {/* Tasks */}
          <NavButton tab={3} currentTab={currentTab} onClick={setCurrentTab} icon={<ClipboardList className="w-5 h-5" />} label="Tasks" />

          {/* Calls */}
          <NavButton tab={4} currentTab={currentTab} onClick={setCurrentTab} icon={<Phone className="w-5 h-5" />} label="Calls" />

          {/* Vault */}
          <NavButton tab={5} currentTab={currentTab} onClick={setCurrentTab} icon={<Shield className="w-5 h-5" />} label="Vault" />

          {/* Notifications */}
          <NavButton tab={6} currentTab={currentTab} onClick={setCurrentTab} icon={<Bell className="w-5 h-5" />} label="Alerts" />

          {/* SOS */}
          <button
            onClick={() => setCurrentTab(7)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all font-bold min-w-[52px] ${
              currentTab === 7
                ? "bg-red-600 text-white shadow-md shadow-red-200"
                : "text-[#ba1a1a] hover:bg-red-50/50"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">SOS</span>
          </button>

          {/* Settings */}
          <NavButton tab={8} currentTab={currentTab} onClick={setCurrentTab} icon={<Settings className="w-5 h-5" />} label="Settings" />
        </div>
      </nav>
    </div>
  );
}

interface NavButtonProps {
  tab: number;
  currentTab: number;
  onClick: (tab: number) => void;
  icon: React.ReactNode;
  label: string;
  activePulse?: boolean;
}

function NavButton({ tab, currentTab, onClick, icon, label, activePulse }: NavButtonProps) {
  const isActive = currentTab === tab;
  return (
    <button
      onClick={() => onClick(tab)}
      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer min-w-[52px] ${
        isActive
          ? `bg-[#ffdcc2] text-[#8e4e08] font-bold ${activePulse ? 'animate-pulse' : ''} scale-105`
          : "text-slate-500 hover:text-slate-800"
      }`}
    >
      {icon}
      <span className="text-[10px] mt-0.5 tracking-wide">{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}