import React from 'react';
import { Home, Users, Mic, Archive, AlertCircle } from 'lucide-react';
import { Screen, Language } from '../types';
import { translations } from '../i18n';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  language: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  language
}) => {
  const t = translations[language];

  const items = [
    { id: 'home' as Screen, label: t.navHome, icon: Home },
    { id: 'shared' as Screen, label: t.navShared, icon: Users },
    { id: 'speak' as Screen, label: t.navSpeak, icon: Mic, isCenter: true },
    { id: 'vault' as Screen, label: t.navVault, icon: Archive },
    { id: 'sos' as Screen, label: t.navSos, icon: AlertCircle, isDanger: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#D8C2B3] shadow-lg">
      <div className="flex justify-around items-end pb-3 pt-2 px-2 max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = currentScreen === item.id;
          const Icon = item.icon;

          if (isActive) {
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center rounded-full p-2 h-14 w-14 transition-all duration-200 active:scale-95 shadow-md ${
                  item.isDanger
                    ? 'bg-[#BA1A1A] text-white'
                    : 'bg-[#DC8E47] text-white'
                }`}
                title={item.label}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-wider leading-none mt-1">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-150 active:scale-95 hover:bg-black/5 ${
                item.isDanger
                  ? 'text-[#BA1A1A]'
                  : 'text-[#534438] hover:text-[#1A0D0A]'
              }`}
              title={item.label}
            >
              <Icon className="w-6 h-6" />
              <span className={`text-[10px] font-semibold uppercase tracking-wider leading-none mt-1 ${
                item.isDanger ? 'text-[#BA1A1A]' : 'text-[#534438]'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
