import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Bell, Heart } from "lucide-react";

interface HeaderProps {}

export default function Header({}: HeaderProps) {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="w-full sticky top-0 bg-white border-b border-[#d8c2b3]/40 z-40 flex justify-between items-center px-4 py-3 h-16 shadow-xs max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#dc8e47] bg-[#ffdcc2] flex items-center justify-center text-[#8e4e08] font-extrabold text-sm">
          {initials}
        </div>
        <div>
          <h1 className="font-sans font-extrabold text-[22px] tracking-tight text-[#8e4e08]" id="appTitle">
            FamilyOS
          </h1>
          <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-medium">
            {user?.name ? `Welcome, ${user.name.split(" ")[0]}` : "Kinetic Harmony v1.2"}
          </p>
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
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
            <div className="p-3 bg-[#fdfaf7] border-b border-orange-100 flex justify-between items-center">
              <span className="font-semibold text-sm text-[#8e4e08]">Family Alerts</span>
            </div>

            <div className="max-h-72 overflow-y-auto">
              <div className="p-6 text-center text-slate-400 text-xs">
                <Heart className="w-8 h-8 text-orange-200 mx-auto mb-2" />
                Check the Alerts tab for notifications.
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}