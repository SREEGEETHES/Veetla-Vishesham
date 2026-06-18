import React, { useState, useEffect, useCallback } from "react";
import { Bell, Check, Trash2, Info, AlertTriangle, AlertOctagon, Calendar } from "lucide-react";
import { NotificationItem } from "../types";

export default function NotificationsView() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("familyos_token") || "";

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
      }
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  const handleClearAll = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  const getLevelIcon = (level: NotificationItem['level']) => {
    if (level === 'emergency') return <AlertOctagon className="w-4 h-4 text-[#ba1a1a]" />;
    if (level === 'warning') return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    return <Info className="w-4 h-4 text-[#006783]" />;
  };

  const getLevelColor = (level: NotificationItem['level']) => {
    if (level === 'emergency') return 'bg-red-50 border-red-200';
    if (level === 'warning') return 'bg-orange-50 border-orange-200';
    return 'bg-slate-50 border-slate-200';
  };

  const getLevelDot = (level: NotificationItem['level']) => {
    if (level === 'emergency') return 'bg-[#ba1a1a]';
    if (level === 'warning') return 'bg-orange-500';
    return 'bg-[#006783]';
  };

  // Group by date
  const now = new Date();
  const today = now.toDateString();
  const isToday = (ts: string) => {
    if (ts === "Just now" || ts === "Emergency") return true;
    return false;
  };

  const todayNotifications = notifications.filter(n => isToday(n.timestamp));
  const earlierNotifications = notifications.filter(n => !isToday(n.timestamp));

  return (
    <div className="space-y-6 pt-2 pb-12 px-4 max-w-lg mx-auto text-left" id="notificationsView">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-[#dc8e47]" />
          <h2 className="font-sans font-extrabold text-xl text-slate-800">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-[#ba1a1a] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-slate-400 hover:text-[#ba1a1a] transition-colors font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#dc8e47] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-xs text-center">
          <Bell className="w-12 h-12 text-orange-200 mx-auto mb-3" />
          <p className="font-sans font-bold text-slate-500 text-base">All clear!</p>
          <p className="text-xs text-slate-400 mt-1">No family alerts at the moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today */}
          {todayNotifications.length > 0 && (
            <div>
              <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Today
              </h3>
              <div className="space-y-2.5">
                {todayNotifications.map(item => (
                  <NotificationCard
                    item={item}
                    onMarkRead={handleMarkRead}
                    getLevelIcon={getLevelIcon}
                    getLevelColor={getLevelColor}
                    getLevelDot={getLevelDot}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Earlier */}
          {earlierNotifications.length > 0 && (
            <div>
              <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Earlier
              </h3>
              <div className="space-y-2.5">
                {earlierNotifications.map(item => (
                  <NotificationCard
                    item={item}
                    onMarkRead={handleMarkRead}
                    getLevelIcon={getLevelIcon}
                    getLevelColor={getLevelColor}
                    getLevelDot={getLevelDot}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface NotificationCardProps {
  item: NotificationItem;
  onMarkRead: (id: string) => void;
  getLevelIcon: (level: NotificationItem['level']) => React.ReactElement;
  getLevelColor: (level: NotificationItem['level']) => string;
  getLevelDot: (level: NotificationItem['level']) => string;
}

function NotificationCard({ item, onMarkRead, getLevelIcon, getLevelColor, getLevelDot }: NotificationCardProps) {
  return (
    <div
      className={`rounded-xl p-4 border transition-all ${getLevelColor(item.level)} ${item.read ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getLevelDot(item.level)}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {getLevelIcon(item.level)}
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{item.timestamp}</span>
          </div>
          <p className={`text-sm font-sans leading-relaxed ${item.read ? 'text-slate-500' : 'text-slate-800 font-medium'}`}>
            {item.text}
          </p>
        </div>
        {!item.read && (
          <button
            onClick={() => onMarkRead(item.id)}
            className="p-1.5 rounded-full bg-white border border-slate-200 text-[#8e4e08] hover:bg-orange-50 transition-colors cursor-pointer flex-shrink-0"
            title="Mark as read"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}