import { useState } from "react";
import { 
  Mic, CheckCircle, Circle, Heart, Gift, Shield, Compass, Sparkles, 
  AlertCircle, ArrowRight, PhoneCall, Phone, PhoneOff, Volume2, Clock 
} from "lucide-react";
import { Reminder, FamilyMember } from "../types";
import { motion } from "motion/react";

interface HomeViewProps {
  reminders: Reminder[];
  onToggleReminder: (id: string) => void;
  onNavigateToTab: (index: number) => void;
  onGenerateGiftSuggestions: (query: string, recipient: string) => Promise<string[]>;
}

export default function HomeView({ 
  reminders, 
  onToggleReminder, 
  onNavigateToTab,
  onGenerateGiftSuggestions 
}: HomeViewProps) {
  // AI gift drawer states
  const [giftDrawerOpen, setGiftDrawerOpen] = useState(false);
  const [giftQuery, setGiftQuery] = useState("");
  const [giftRecipient, setGiftRecipient] = useState("Mom");
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [derivedGifts, setDerivedGifts] = useState<string[]>([]);

  // Simulated Dynamic Call Alerts state
  const [simulatedCallActive, setSimulatedCallActive] = useState(false);
  const [simulatedCallStatus, setSimulatedCallStatus] = useState<'ringing' | 'active' | 'snoozed' | 'declined'>('ringing');

  // Calculate birthday countdown (Saturday June 20, 2026. Ref day June 17, 2026 is Wed, in 3 days)
  const currentDay = 17;
  const bdayDay = 20;
  const daysLeft = bdayDay - currentDay;

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

  const handleTriggerCallSim = () => {
    setSimulatedCallStatus('ringing');
    setSimulatedCallActive(true);
  };

  const handleSnoozeCall = () => {
    setSimulatedCallStatus('snoozed');
  };

  const handleDeclineCall = () => {
    setSimulatedCallStatus('declined');
  };

  const handleAnswerCall = () => {
    setSimulatedCallStatus('active');
  };

  return (
    <div className="space-y-6 pt-2 pb-12 px-4 max-w-lg mx-auto" id="homeView">
      
      {/* Welcome Section */}
      <section className="mt-2 animate-fade-in text-left">
        <h2 className="font-sans font-extrabold text-[#1a1c1c] text-[32px] leading-10 tracking-tight">
          Good Morning, <br />
          <span className="text-[#dc8e47]">The Millers</span>
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
                  onClick={() => onToggleReminder(item.id)}
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
                    {item.time} • {item.member}
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
            View Full Calendar & Chores
          </button>
        </section>

        {/* Dynamic Simulated Call alerts ringer trigger */}
        <section className="bg-white rounded-2xl p-5 border border-[#d8c2b3]/25 shadow-xs relative overflow-hidden text-left">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <PhoneCall className="w-14 h-14 text-[#dc8e47]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-sans font-bold text-[#1a1c1c] text-lg">Incoming Call Alerts</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Scheduled tasks trigger integrated multi-device voice synthesis systems. Turn on live simulator below!
            </p>
          </div>
          <button
            onClick={handleTriggerCallSim}
            className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-[#dc8e47] to-[#8e4e08] hover:to-[#dc8e47] text-white font-sans font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer border-none"
          >
            <PhoneCall className="w-4 h-4 animate-bounce" /> Simulate Call Reminder ("Grandma")
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

        {/* Secure Vault Shortcut Preview */}
        <section 
          onClick={() => onNavigateToTab(3)} 
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

      {/* FULL SCREEN INCOMING CALL REMINDER OVERLAY */}
      {simulatedCallActive && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-md z-50 flex flex-col justify-between p-6 text-white animate-fade-in max-w-lg mx-auto">
          {simulatedCallStatus === 'ringing' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 my-auto relative">
              {/* Pulsing ring indicator */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-orange-500/20 scale-150 animate-ping"></div>
                <div className="absolute inset-0 rounded-full bg-cyan-400/10 scale-125 animate-ping"></div>
                <div className="w-32 h-32 rounded-full border-4 border-[#dc8e47] overflow-hidden shadow-2xl relative z-10">
                  <img 
                    alt="Grandma Avatar" 
                    className="w-full h-full object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCj0SLM6vB0swgjRMW649bRcHXtkIsb91RMFKt61wm67N7MMSsWXQrXxViKCYFAHU4DxFot65S-b2RsC2zgRD3zqJQ6BONzMTBW4n7ttcxl_3FAbPap6UNJY4Qf7Vsepm20WMdm5r8FqXUmLUb0EJyVMvnIxk1vo3sHnxuzOP1pDw0QIF4xygqsGhDfxNz74_UWBrlFYXjS7Qm0aj6sDQq7xmXi6tTpYneAYFcA9MQMT9Or8COHc0djLdg974jMoRsHWnnWZ9kX3F8"
                  />
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-xs uppercase tracking-widest font-mono text-cyan-400 font-extrabold">Active Call Reminder</p>
                <h3 className="text-3xl font-extrabold font-sans text-white">Grandma (Call Alert)</h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto italic">
                  Scheduled Alert System • "Confirm if high tea scones are packed"
                </p>
              </div>

              {/* Ringer visualizer */}
              <div className="flex gap-1.5 items-center justify-center h-8 my-2">
                <span className="w-1 h-3 bg-[#dc8e47] rounded-full animate-bounce"></span>
                <span className="w-1 h-6 bg-[#3fccfd] rounded-full animate-bounce delay-75"></span>
                <span className="w-1 h-8 bg-white rounded-full animate-bounce delay-150"></span>
                <span className="w-1 h-5 bg-[#3fccfd] rounded-full animate-bounce delay-100"></span>
                <span className="w-1 h-3 bg-[#dc8e47] rounded-full animate-bounce"></span>
              </div>

              {/* Interaction buttons */}
              <div className="w-full max-w-xs grid grid-cols-3 gap-4 pt-12">
                {/* Snooze Call */}
                <button 
                  onClick={handleSnoozeCall}
                  className="flex flex-col items-center gap-2 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <span className="p-4 bg-slate-800 rounded-full hover:bg-slate-700 transition flex items-center justify-center">
                    <Clock className="w-6 h-6 text-slate-300" />
                  </span>
                  <span className="text-[10px] font-bold">Snooze 10m</span>
                </button>

                {/* Decline */}
                <button 
                  onClick={handleDeclineCall}
                  className="flex flex-col items-center gap-2 text-red-400 hover:text-red-300 transition cursor-pointer"
                >
                  <span className="p-4 bg-red-600 rounded-full hover:bg-red-500 transition flex items-center justify-center">
                    <PhoneOff className="w-6 h-6 text-white" />
                  </span>
                  <span className="text-[10px] font-bold">Decline</span>
                </button>

                {/* Answer Call info */}
                <button 
                  onClick={handleAnswerCall}
                  className="flex flex-col items-center gap-2 text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                >
                  <span className="p-4 bg-emerald-600 rounded-full hover:bg-emerald-500 transition animate-bounce flex items-center justify-center">
                    <Phone className="w-6 h-6 text-white" />
                  </span>
                  <span className="text-[10px] font-bold">Answer AI</span>
                </button>
              </div>
            </div>
          )}

          {simulatedCallStatus === 'active' && (
            <div className="flex-1 flex flex-col justify-between py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 rounded-full border-2 border-emerald-500 overflow-hidden relative">
                  <img 
                    alt="Grandma Avatar"
                    className="w-full h-full object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCj0SLM6vB0swgjRMW649bRcHXtkIsb91RMFKt61wm67N7MMSsWXQrXxViKCYFAHU4DxFot65S-b2RsC2zgRD3zqJQ6BONzMTBW4n7ttcxl_3FAbPap6UNJY4Qf7Vsepm20WMdm5r8FqXUmLUb0EJyVMvnIxk1vo3sHnxuzOP1pDw0QIF4xygqsGhDfxNz74_UWBrlFYXjS7Qm0aj6sDQq7xmXi6tTpYneAYFcA9MQMT9Or8COHc0djLdg974jMoRsHWnnWZ9kX3F8"
                  />
                  <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
                </div>
                <h4 className="font-sans font-extrabold text-xl">Connecting with Grandma...</h4>
                <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest animate-pulse">
                  AI Voice Synthesizer active
                </p>
              </div>

              {/* simulated transcription dialogue */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 max-w-sm mx-auto text-left">
                <div className="flex items-center gap-2 text-[#dc8e47]">
                  <Volume2 className="w-4 h-4 animate-bounce" />
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Simulated Audio Broadcast</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans italic">
                  "Hello sweetie! Oh, I am so glad safety dials called me back seamlessly! I just wanted to remind you to pack scones for high tea tomorrow at 4:30 PM. Tell Dad the leaves are looking beautiful!"
                </p>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <button 
                  onClick={() => setSimulatedCallActive(false)}
                  className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-500 active:scale-95 transition shadow-lg cursor-pointer"
                >
                  <PhoneOff className="w-8 h-8 text-white" />
                </button>
                <span className="text-[10px] text-slate-400">End simulated reminder session</span>
              </div>
            </div>
          )}

          {simulatedCallStatus === 'snoozed' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <span className="text-amber-400 text-lg uppercase tracking-widest font-extrabold font-mono">Alert Snoozed</span>
              <p className="text-xs text-slate-400 text-center max-w-xs leading-relaxed">
                We will repeat this urgent family call reminder alert in 10 minutes to verify your task execution.
              </p>
              <button 
                onClick={() => setSimulatedCallActive(false)}
                className="bg-slate-800 hover:bg-slate-700 px-6 py-2.5 rounded-full text-xs font-bold transition font-sans cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {simulatedCallStatus === 'declined' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <span className="text-rose-400 text-lg uppercase tracking-widest font-extrabold font-mono">Alert Silenced</span>
              <p className="text-xs text-slate-400 text-center max-w-xs leading-relaxed">
                The reminder alert has been silenced and cached onto your "Pending Call Tasks" dashboard checklist.
              </p>
              <button 
                onClick={() => setSimulatedCallActive(false)}
                className="bg-slate-800 hover:bg-slate-700 px-6 py-2.5 rounded-full text-xs font-bold transition font-sans cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
