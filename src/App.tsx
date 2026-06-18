import React, { useState, useEffect, useRef } from "react";
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
  const [taskCall, setTaskCall] = useState<{ body: string } | null>(null);
  const { user } = useAuth();
  const lastNotifIdRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Request browser notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Periodic check for tasks due today
  useEffect(() => {
    const checkDueTasks = async () => {
      const token = localStorage.getItem("familyos_token");
      if (!token || !user) return;
      try {
        const res = await fetch("/api/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const tasks = await res.json();
          const today = new Date().toISOString().split("T")[0];
          const dueToday = tasks.filter(
            (t: any) => !t.completed && t.due_date === today && t.assignee_id === user.id
          );
          for (const task of dueToday) {
            sendBrowserNotification(
              "⏰ Task Due Today",
              `"${task.title}" is due today!`
            );
          }
        }
      } catch {}
    };
    checkDueTasks();
    const interval = setInterval(checkDueTasks, 120000);
    return () => clearInterval(interval);
  }, [user]);

  const sendBrowserNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icon.svg" });
    }
  };

  function playRingtone() {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const t = i * 0.5;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = i % 2 === 0 ? 440 : 480;
        gain.gain.setValueAtTime(0.3, now + t);
        gain.gain.exponentialRampToValueAtTime(0.01, now + t + 0.4);
        osc.start(now + t);
        osc.stop(now + t + 0.45);
      }
      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } catch {}
  }

  function stopRingtone() {
    try {
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    } catch {}
  }

  // Poll for new task notifications with call overlay
  useEffect(() => {
    const pollNotifications = async () => {
      const token = localStorage.getItem("familyos_token");
      if (!token || !user) return;
      try {
        const res = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const notifs = await res.json();
          if (Array.isArray(notifs) && notifs.length > 0) {
            const maxId = Math.max(...notifs.map((n: any) => n.id));
            if (maxId > lastNotifIdRef.current && lastNotifIdRef.current > 0) {
              const newNotifs = notifs.filter((n: any) => n.id > lastNotifIdRef.current);
              const taskNotif = newNotifs.find(
                (n: any) => n.text.includes("New task:") || n.text.includes("Task assigned") || n.text.includes("reassigned") || n.text.includes("task completed")
              );
              if (taskNotif && !taskCall) {
                setTaskCall({ body: taskNotif.text });
                playRingtone();
              }
            }
            lastNotifIdRef.current = maxId;
          }
        }
      } catch {}
    };
    pollNotifications();
    const interval = setInterval(pollNotifications, 5000);
    return () => {
      clearInterval(interval);
      stopRingtone();
    };
  }, [user]);

  const resolveMemberName = async (name: string, token: string): Promise<number | null> => {
    try {
      const res = await fetch("/api/members", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const members = await res.json();
        const member = members.find(
          (m: any) => m.name.toLowerCase() === name.toLowerCase()
        );
        return member ? member.id : null;
      }
    } catch {}
    return null;
  };

  // --- ACTIONS HANDLERS ---

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

    // Resolve assignee/member name to ID
    let assigneeId: number | null = null;
    const nameToFind = data.assignee || data.member;
    if (nameToFind) {
      assigneeId = await resolveMemberName(nameToFind, token);
    }

    try {
      if (type === "reminder") {
        const res = await fetch("/api/reminders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: data.text || "Generic voice reminder",
            time: data.time || "12:00 PM",
            category: data.category || "general",
            member_id: assigneeId,
          }),
        });
        if (res.ok) {
          sendBrowserNotification("Reminder Set", data.text || "Reminder created");
        }
      } else if (type === "chore") {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: data.title || "Voice Chore",
            description: data.text || "",
            assignee_id: assigneeId,
            due_date: data.dueDate || "",
            points: data.points || 10,
            category: "general",
          }),
        });
        if (res.ok) {
          sendBrowserNotification(
            "Task Assigned",
            `"${data.title || 'New task'}" assigned to ${data.assignee || 'someone'}`
          );
        }
      } else if (type === "calendar") {
        const res = await fetch("/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: data.title || "Vibe Appointment",
            date: data.date || "2026-06-20",
            time: data.time || "4:00 PM",
            category: data.category || "family",
            member_id: assigneeId,
          }),
        });
        if (res.ok) {
          sendBrowserNotification(
            "Event Scheduled",
            data.title || "Calendar event created"
          );
        }
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

        {currentTab === 7 && <SOSView />}

        {currentTab === 8 && (
          <SettingsView onNavigateToAdmin={() => setShowAdmin(true)} />
        )}
      </main>

      {/* Incoming Task Call Overlay */}
      {taskCall && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up">
            <div className="bg-gradient-to-b from-[#8e4e08] to-[#dc8e47] p-6 text-center text-white">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <Phone className="w-10 h-10 text-white" />
              </div>
              <p className="text-xs uppercase tracking-widest font-bold opacity-80">Incoming Task Call</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-slate-700 leading-relaxed mb-6">{taskCall.body}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    stopRingtone();
                    setTaskCall(null);
                  }}
                  className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-600 font-bold text-xs hover:bg-red-50 transition cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    stopRingtone();
                    setTaskCall(null);
                    setCurrentTab(3);
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#006783] to-[#3fccfd] text-white font-bold text-xs hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <ClipboardList className="w-4 h-4" /> View Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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