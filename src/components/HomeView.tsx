import { useState, useEffect } from "react";
import { 
  Mic, CheckCircle, Circle, Heart, Gift, Shield, Sparkles, 
  PhoneCall, Compass
} from "lucide-react";
import { Reminder, User, Task } from "../types";
import { motion } from "motion/react";

interface HomeViewProps {
  onNavigateToTab: (index: number) => void;
  onGenerateGiftSuggestions: (query: string, recipient: string) => Promise<string[]>;
  currentUser?: User;
}

export default function HomeView({ 
  onNavigateToTab,
  onGenerateGiftSuggestions,
  currentUser 
}: HomeViewProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // AI gift drawer states
  const [giftDrawerOpen, setGiftDrawerOpen] = useState(false);
  const [giftQuery, setGiftQuery] = useState("");
  const [giftRecipient, setGiftRecipient] = useState("Mom");
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [derivedGifts, setDerivedGifts] = useState<string[]>([]);

  // Fetch reminders and tasks on mount
  useEffect(() => {
    const token = localStorage.getItem("familyos_token");
    const headers = { Authorization: "Bearer " + token };

    Promise.all([
      fetch("/api/reminders", { headers }),
      fetch("/api/tasks", { headers }),
    ])
      .then(([remRes, taskRes]) =>
        Promise.all([remRes.json(), taskRes.json()])
      )
      .then(([remData, taskData]) => {
        setReminders(Array.isArray(remData) ? remData : []);
        // Show top 3-5 upcoming/pending tasks
        const pending = Array.isArray(taskData)
          ? taskData
              .filter((t: Task) => !t.completed)
              .slice(0, 5)
          : [];
        setTasks(pending);
      })
      .catch((err) => {
        console.error("Failed to load dashboard data:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleToggleReminder = async (id: number, current: boolean) => {
    const token = localStorage.getItem("familyos_token");
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ completed: !current }),
      });
      if (res.ok) {
        setReminders((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, completed: Number(!current) } : r
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle reminder:", err);
    }
  };

  // Calculate birthday countdown (Saturday June 20, 2026. Ref day June 17, 2026 is Wed, in 3 days)
  const currentDay = 17;
  const bdayDay = 20;
  const daysLeft = bdayDay - currentDay;

  // Get greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const handleOpenGifts = () => {
    setGiftDrawerOpen(true);
    setDerivedGifts([]);
  };

  const handleFetchGifts = async () => {
    setLoadingGifts(true);
    try {
      const result = await onGenerateGiftSuggestions(giftQuery, giftRecipient);
      setDerivedGifts(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGifts(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="animate-spin w-8 h-8 border-4 border-[#dc8e47] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2 pb-12 px-4 max-w-lg mx-auto" id="homeView">
      
      {/* Welcome Section */}
      <section className="mt-2 animate-fade-in text-left">
        <h2 className="font-sans font-extrabold text-[#1a1c1c] text-[32px] leading-10 tracking-tight">
          {greeting}, <br />
          <span className="text-[#dc8e47]">{currentUser?.name || "Family"}</span>
        </h2>
        <p className="font-sans text-[18px] text-slate-500 mt-1 leading-normal font-normal">
          Everything is running smoothly today.
        </p>
      </section>

      {/* Main Kinetic Action: Speak Task */}
      <section className="flex flex-col items-center py-4 bg-radial from-orange-50/10 to-transparent">
        <button 
          onClick={() => onNavigateToTab(2)} // Swaps onto Speak Tab
          className="group relative flex flex-col items-center justify-center w-44 h-44 rounded-full bg-[#dc8e47] text-white active:scale-95 hover:scale-102 transition-all duration-300 shadow-md cursor-pointer border-none"
          id="speakButton"
          title="Parse details via Voice / Text Assistant"
        >
          {/* Animated rings */}
          <div className="absolute inset-0 rounded-full border-4 border-[#ffdcc2] opacity-30 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="absolute -inset-2 rounded-full bg-[#dc8e47] opacity-10 animate-ping duration-1000"></div>
          
          <Mic className="w-16 h-16 mb-2 text-white" />
          <span className="font-sans font-extrabold text-[15px] uppercase tracking-widest text-[#2e1500]">
            Speak Task
          </span>
        </button>
        <p className="mt-4 font-sans text-[15px] text-slate-500 text-center px-4 italic leading-relaxed">
          "Remind me to call Grandma at 4 PM"
        </p>
      </section>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Today's Reminders Block */}
        <section className="bg-white rounded-2xl p-5 border border-[#d8c2b3]/20 shadow-xs relative overflow-hidden text-left">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#3fccfd]"></div>
          
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-sans font-bold text-[#1a1c1c] text-lg">Today's Reminders</h3>
            <span className="p-1.5 rounded-lg bg-[#bde9ff]" title="Shared Events">
              <Compass className="w-5 h-5 text-[#006783]" />
            </span>
          </div>

          <div className="space-y-3">
            {reminders.slice(0, 3).map((item) => (
              <div 
                key={item.id} 
                className="flex items-center gap-3 p-3 bg-[#fdfaf7] rounded-xl border border-[#d8c2b3]/10"
              >
                <button 
                  onClick={() => handleToggleReminder(item.id, item.completed)}
                  className="flex-shrink-0 text-[#006783] hover:opacity-80 transition cursor-pointer"
                >
                  {item.completed ? (
                    <CheckCircle className="w-6 h-6 text-[#dc8e47] fill-[#ffdcc2]/50" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-400" />
                  )}
                </button>
                <div className="flex-1">
                  <p className={`font-sans font-semibold text-sm text-slate-800 ${item.completed ? 'line-through opacity-50' : ''}`}>
                    {item.text}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {item.time} • {item.member_name}
                  </p>
                </div>
              </div>
            ))}
            
            {reminders.length === 0 && (
              <div className="p-4 text-center text-slate-400 text-xs">
                No reminders scheduled for today!
              </div>
            )}
          </div>

          <button 
            onClick={() => onNavigateToTab(1)} // Redirects to calendar list
            className="w-full mt-4 py-3 rounded-xl border border-[#006783] text-[#006783] font-sans font-bold text-sm hover:bg-[#bde9ff]/30 active:scale-98 transition-all cursor-pointer"
          >
            View Full Calendar & Shopping
          </button>
        </section>

        {/* Call Alerts Shortcut */}
        <section 
          onClick={() => onNavigateToTab(4)} // Navigate to CallsView tab
          className="bg-white rounded-2xl p-5 border border-[#d8c2b3]/25 shadow-xs relative overflow-hidden text-left cursor-pointer hover:border-[#dc8e47]/40 transition-all"
        >
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <PhoneCall className="w-14 h-14 text-[#dc8e47]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-sans font-bold text-[#1a1c1c] text-lg">Family Calls</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Start a video or audio call with any family member instantly.
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigateToTab(4); }}
            className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-[#dc8e47] to-[#8e4e08] hover:to-[#dc8e47] text-white font-sans font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer border-none"
          >
            <PhoneCall className="w-4 h-4" /> Open Family Calls
          </button>
        </section>

        {/* Family Space Block */}
        <section className="bg-white rounded-2xl p-5 border border-[#d8c2b3]/20 shadow-xs text-left">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-sans font-bold text-[#1a1c1c] text-lg">Family Space</h3>
            <Heart className="w-5 h-5 text-[#ba1a1a] fill-[#ba1a1a]/10" />
          </div>

          {/* Birthday Countdown alert from HTML mockup */}
          <div className="bg-[#ffdcc2] p-4 rounded-xl flex flex-col items-center text-center relative overflow-hidden">
            <span className="absolute top-1 right-2 w-14 h-14 bg-[#8e4e08] opacity-5 rounded-full flex items-center justify-center">
              <Gift className="w-12 h-12" />
            </span>
            
            <div className="w-16 h-16 rounded-full border-2 border-white overflow-hidden mb-2 z-10 shadow-md">
              <img 
                alt="Mom Avatar" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLAstU3QQLkiWNYRWk-vFsptDGgW9jJz_BlyIMlRQOxVJXQ_MNBgGmhNIpHExqeytkI77bRGgPLCDgpb0OLNtll3JKuMxC3QpZFz_oFw0auQ8APEOe0XEaixyg8T3TrSZd_sudfnivf6pLZ6GaidWGsWww6qK1MGKAH5DeAhUjutPUiMC5yyp2dOFVhw258n-lFl3z7bdgQ0g5h8_uZqTHpEo4279rQPrhUEGpkhVB_tdhG7nJbAeJsebJYKjjrtv4a0WJbgiGCvM"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <p className="font-sans font-bold text-[#2e1500] text-base leading-normal">
              Mom's Birthday Party
            </p>
            <p className="text-[13px] text-[#6d3a00] font-medium">
              In {daysLeft} days • Saturday June 20th
            </p>

            <div className="mt-4 flex gap-3 w-full">
              <button 
                onClick={() => onNavigateToTab(1)} // View cards / shared calendar
                className="flex-1 bg-[#8e4e08] text-white py-2 rounded-full text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
              >
                Card RSVPs
              </button>
              <button 
                onClick={handleOpenGifts}
                className="flex-1 bg-white text-[#8e4e08] py-2 rounded-full text-xs font-bold border border-[#ffdcc2] hover:bg-orange-50 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" /> Gift Ideas
              </button>
            </div>
          </div>
        </section>

        {/* Tasks Preview Block */}
        {tasks.length > 0 && (
          <section className="bg-white rounded-2xl p-5 border border-[#d8c2b3]/20 shadow-xs text-left">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-sans font-bold text-[#1a1c1c] text-lg">Upcoming Tasks</h3>
            </div>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-[#fdfaf7] rounded-xl border border-[#d8c2b3]/10">
                  <Circle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-semibold text-sm text-slate-800 truncate">{task.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {task.assignee_name ?? "Unassigned"} • Due {task.due_date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigateToTab(3)}
              className="w-full mt-4 py-3 rounded-xl border border-[#8e4e08] text-[#8e4e08] font-sans font-bold text-sm hover:bg-orange-50/30 active:scale-98 transition-all cursor-pointer"
            >
              View All Tasks
            </button>
          </section>
        )}

        {/* Secure Vault Shortcut Preview */}
        <section 
          onClick={() => onNavigateToTab(5)} 
          className="bg-radial from-[#ffdcc2]/20 to-[#3fccfd]/10 p-5 rounded-2xl border border-[#d8c2b3]/20 hover:border-[#3fccfd]/40 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <span className="p-3 bg-white rounded-xl shadow-xs text-[#006783] flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </span>
            <div>
              <h3 className="font-sans font-bold text-[#1a1c1c] text-base">Secure Local Vault</h3>
              <p className="text-xs text-slate-500 mt-0.5">WiFi password & family records locked securely</p>
            </div>
          </div>
        </section>

      </div>

      {/* AI Gift Generator Slideover Drawer Modal */}
      {giftDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-t-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl relative text-left transition-all duration-300">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#dc8e47]" />
                <h4 className="font-sans font-bold text-lg text-slate-800">Gift Planning Assistant</h4>
              </div>
              <button 
                onClick={() => setGiftDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-full text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Generate customizable, highly relevant gift ideas via Gemini AI. Select interests to fine-tune recommendations.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Recipient</label>
                <select 
                  value={giftRecipient} 
                  onChange={(e) => setGiftRecipient(e.target.value)}
                  className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-sans"
                >
                  <option value="Mom">Mom (Cheery, Garden enthusiast, Kitchen Baker)</option>
                  <option value="Dad">Dad (Tech enthusiast, Gardening, Fitness fan)</option>
                  <option value="Kids">Kids (Legos, Gaming, Outdoor adventures)</option>
                  <option value="Grandma">Grandma (Calligraphy, Tea culture, Knits)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Interests or Keywords</label>
                <input 
                  type="text" 
                  value={giftQuery}
                  onChange={(e) => setGiftQuery(e.target.value)}
                  placeholder="cozy home styling, lavender, organic spices, garden tools..." 
                  className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-sans"
                />
              </div>

              <button 
                onClick={handleFetchGifts}
                disabled={loadingGifts}
                className="w-full bg-[#8e4e08] hover:bg-[#dc8e47] text-white py-3 rounded-xl font-sans font-bold text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingGifts ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Synthesizing with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Recommend Curated Gifts
                  </>
                )}
              </button>
            </div>

            {/* Rendered Gift list output */}
            {derivedGifts.length > 0 && (
              <div className="space-y-2.5 mt-4 pt-4 border-t border-slate-100">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Curated Recommendations</h5>
                {derivedGifts.map((idea, index) => (
                  <div key={index} className="p-3 bg-orange-50/40 rounded-xl border border-orange-100 flex items-start gap-2.5 animate-fade-in">
                    <p className="text-xs font-sans text-slate-700 leading-relaxed">
                      {idea}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}