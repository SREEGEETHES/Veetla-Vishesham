import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { LogOut, Shield, Users, Info } from 'lucide-react';

interface SettingsViewProps {
  onNavigateToAdmin?: () => void;
}

export default function SettingsView({ onNavigateToAdmin }: SettingsViewProps) {
  const { user, logout, isAdmin, authFetch } = useAuth();
  const [members, setMembers] = useState<User[]>([]);

  useEffect(() => {
    authFetch('/api/members').then((res) => {
      if (res.ok) res.json().then(setMembers);
    });
  }, [authFetch]);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#ffdcc2] mx-auto mb-3 flex items-center justify-center text-2xl font-extrabold text-[#8e4e08]">
          {initials}
        </div>
        <h2 className="text-lg font-extrabold text-slate-800">{user?.name}</h2>
        <p className="text-sm text-slate-500">{user?.email}</p>
        <div className="mt-3 flex justify-center">
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
            user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {user?.role === 'admin' ? 'Admin' : 'Member'}
          </span>
        </div>
      </div>

      {/* Family Members */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 bg-[#ffdcc2] border-b border-[#d8c2b3]/40 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#8e4e08]" />
          <h3 className="font-semibold text-sm text-[#8e4e08]">Family Members</h3>
        </div>
        {members.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-xs">Loading members...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((m) => (
              <div key={m.id} className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#ffdcc2] flex items-center justify-center text-[#8e4e08] font-bold text-xs">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-800">{m.name}</p>
                  <p className="text-xs text-slate-400">{m.email}</p>
                </div>
                {m.role === 'admin' && (
                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-semibold">Admin</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin actions */}
      {isAdmin && (
        <button
          onClick={onNavigateToAdmin}
          className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3 hover:bg-purple-50 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-800">Manage Pending Members</p>
            <p className="text-xs text-slate-500">Approve or reject new registrations</p>
          </div>
        </button>
      )}

      {/* About */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center gap-3 mb-2">
          <Info className="w-4 h-4 text-slate-400" />
          <h3 className="font-semibold text-sm text-slate-600">About FamilyOS</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          FamilyOS v1.0 — Your Family, Connected. A secure, self-hostable family coordination app.
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full py-3 bg-white border-2 border-red-200 text-red-500 font-bold rounded-xl text-sm hover:bg-red-50 transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );
}