import React from 'react';
import { Bell, PhoneCall, Globe, Shield, User as UserIcon, LogIn } from 'lucide-react';
import { Language, User } from '../types';
import { translations } from '../i18n';

interface HeaderProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  currentUser: User | null;
  onOpenProfile: () => void;
  onOpenLogin: () => void;
  onOpenNotifications: () => void;
  onTriggerTestCall: () => void;
  unreadNotifications: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  onLanguageChange,
  currentUser,
  onOpenProfile,
  onOpenLogin,
  onOpenNotifications,
  onTriggerTestCall,
  unreadNotifications
}) => {
  const t = translations[currentLanguage];

  return (
    <header className="w-full top-0 sticky z-40 bg-[#F9F9F9]/95 backdrop-blur-md border-b border-[#D8C2B3]/60 px-4 h-16 flex justify-between items-center max-w-lg mx-auto transition-colors">
      {/* Left: User Avatar & App Title */}
      <div className="flex items-center gap-2.5">
        {currentUser ? (
          <button
            type="button"
            onClick={onOpenProfile}
            title={`Profile of ${currentUser.name}`}
            className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#DC8E47] hover:scale-105 active:scale-95 transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-[#DC8E47] cursor-pointer"
          >
            <img
              alt={currentUser.name}
              className="w-full h-full object-cover"
              src={currentUser.avatar}
            />
            {currentUser.role === 'master' && (
              <span
                className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#8E4E08] border border-white rounded-full flex items-center justify-center text-[7px] text-white font-bold"
                title="Master Admin"
              >
                ★
              </span>
            )}
          </button>
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#DC8E47] flex items-center justify-center text-white font-black shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
        )}

        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base sm:text-lg text-[#8E4E08] tracking-tight leading-none">
              {t.appName}
            </span>
          </div>
          {currentUser ? (
            <p className="text-[11px] text-[#534438] font-bold mt-0.5">
              {currentUser.name}
            </p>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="text-[11px] text-[#DC8E47] font-bold flex items-center gap-1 mt-0.5 hover:underline cursor-pointer"
            >
              <LogIn className="w-3 h-3" /> Sign In
            </button>
          )}
        </div>
      </div>

      {/* Right: Language switch + Test Telegram Call + Notifications */}
      <div className="flex items-center gap-2">
        {/* Language Switch Option with English and Tamil */}
        <div className="flex items-center bg-white border border-[#D8C2B3] rounded-full p-0.5 shadow-xs">
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              currentLanguage === 'en'
                ? 'bg-[#DC8E47] text-white shadow-xs'
                : 'text-[#534438] hover:text-[#1A0D0A]'
            }`}
            title="Switch to English"
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('ta')}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              currentLanguage === 'ta'
                ? 'bg-[#DC8E47] text-white shadow-xs'
                : 'text-[#534438] hover:text-[#1A0D0A]'
            }`}
            title="தமிழுக்கு மாறவும்"
          >
            தமிழ்
          </button>
        </div>

        {/* Telegram Test Call quick action */}
        <button
          type="button"
          onClick={onTriggerTestCall}
          title="Test Telegram Voice Call"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#229ED9]/15 text-[#006783] hover:bg-[#229ED9]/25 active:scale-95 transition-all cursor-pointer"
        >
          <PhoneCall className="w-4 h-4 text-[#006783]" />
        </button>

        {/* Notifications Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          title="Notifications"
          className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 active:scale-95 transition-all text-[#8E4E08] cursor-pointer"
        >
          <Bell className="w-5 h-5 stroke-[2.2]" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#BA1A1A] rounded-full ring-2 ring-white animate-pulse" />
          )}
        </button>
      </div>
    </header>
  );
};
