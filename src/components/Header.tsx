import { useState } from "react";
import { Bell, Heart, Check, Trash } from "lucide-react";
import { NotificationItem } from "../types";

interface HeaderProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onClearNotifications: () => void;
}

export default function Header({ notifications, onMarkRead, onClearNotifications }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="w-full sticky top-0 bg-white border-b border-[#d8c2b3]/40 z-40 flex justify-between items-center px-4 py-3 h-16 shadow-xs max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#dc8e47]">
          <img 
            alt="Dad Profile" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCj0SLM6vB0swgjRMW649bRcHXtkIsb91RMFKt61wm67N7MMSsWXQrXxViKCYFAHU4DxFot65S-b2RsC2zgRD3zqJQ6BONzMTBW4n7ttcxl_3FAbPap6UNJY4Qf7Vsepm20WMdm5r8FqXUmLUb0EJyVMvnIxk1vo3sHnxuzOP1pDw0QIF4xygqsGhDfxNz74_UWBrlFYXjS7Qm0aj6sDQq7xmXi6tTpYneAYFcA9MQMT9Or8COHc0djLdg974jMoRsHWnnWZ9kX3F8"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h1 className="font-sans font-extrabold text-[22px] tracking-tight text-[#8e4e08]" id="appTitle">
            FamilyOS
          </h1>
          <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-medium">Kinetic Harmony v1.2</p>
        </div>
      </div>

      <div className="relative">
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative w-11 h-11 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-95 transition-all text-[#8e4e08] cursor-pointer"
          id="btnNotifications"
          title="Notifications"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-5 h-5 bg-[#ba1a1a] text-white text-[11px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
            <div className="p-3 bg-[#fdfaf7] border-b border-orange-100 flex justify-between items-center">
              <span className="font-semibold text-sm text-[#8e4e08]">Family Alerts</span>
              {notifications.length > 0 && (
                <button 
                  onClick={onClearNotifications}
                  className="text-xs text-slate-400 hover:text-[#ba1a1a] transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <Heart className="w-8 h-8 text-orange-200 mx-auto mb-2" />
                  All calm! No new alerts.
                </div>
              ) : (
                notifications.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-3 border-b border-slate-100 flex gap-3 items-start transition-colors ${item.read ? 'opacity-60' : 'bg-orange-50/20'}`}
                  >
                    <div className="flex-1">
                      <p className={`text-xs text-slate-800 ${!item.read ? 'font-semibold' : ''}`}>{item.text}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">{item.timestamp}</span>
                    </div>
                    {!item.read && (
                      <button 
                        onClick={() => onMarkRead(item.id)}
                        className="p-1 rounded-full bg-orange-100 text-[#8e4e08] hover:bg-orange-200 transition-colors cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
