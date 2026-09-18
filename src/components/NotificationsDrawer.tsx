import React from 'react';
import {
  X,
  Bell,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  PhoneCall,
  Send
} from 'lucide-react';
import { SystemNotification } from '../types';
import { soundCtrl } from '../utils/audio';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SystemNotification[];
  onClearNotifications: () => void;
  onTriggerTestCall: () => void;
  cronSecondsRemaining: number;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onClearNotifications,
  onTriggerTestCall,
  cronSecondsRemaining
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="bg-[#F9F9F9] w-full max-w-sm h-full shadow-2xl border-l border-[#D8C2B3] flex flex-col justify-between p-5 animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#D8C2B3]/60 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#DC8E47]/20 text-[#8E4E08] rounded-xl">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-[#1A0D0A]">
                Notifications & Cron
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-[#534438] hover:bg-black/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cron Loop Status Card */}
          <div className="bg-white p-4 rounded-2xl border border-[#3AC9FA] shadow-xs mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#006783] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                60s Cron Loop Active
              </span>
              <span className="text-xs font-mono font-bold text-[#1A0D0A]">
                :{cronSecondsRemaining.toString().padStart(2, '0')}s
              </span>
            </div>
            <p className="text-[11px] text-[#534438] leading-relaxed">
              FamilyOS background polling engine monitors pending SIP calls and schedules CallMeBot Telegram / Voice alerts.
            </p>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  soundCtrl.playPreviewTone();
                  onTriggerTestCall();
                }}
                className="flex-1 py-1.5 bg-[#3AC9FA]/20 text-[#006783] rounded-lg text-xs font-bold hover:bg-[#3AC9FA]/30 flex items-center justify-center gap-1"
              >
                <PhoneCall className="w-3.5 h-3.5" /> Test Voice Call
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-[#534438] uppercase tracking-wider">
                Recent Alerts
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={onClearNotifications}
                  className="text-[11px] text-[#8E4E08] hover:underline font-bold"
                >
                  Clear all
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <p className="text-xs text-[#534438] text-center py-8">
                No new notifications. Everything is running smoothly.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="bg-white p-3.5 rounded-xl border border-[#D8C2B3]/60 shadow-2xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-[#1A0D0A]">{n.title}</h5>
                    <span className="text-[10px] text-[#534438]">{n.time}</span>
                  </div>
                  <p className="text-xs text-[#534438] leading-relaxed">
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#1A0D0A] text-white font-bold rounded-xl text-xs"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
};
