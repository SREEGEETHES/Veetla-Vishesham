import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { Check, X, Users } from 'lucide-react';

interface PendingUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export default function AdminPanel() {
  const { authFetch } = useAuth();
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [penRes, memRes] = await Promise.all([
        authFetch('/api/admin/pending-users'),
        authFetch('/api/admin/users'),
      ]);
      if (penRes.ok) setPending(await penRes.json());
      if (memRes.ok) setMembers(await memRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await authFetch(`/api/admin/approve/${id}`, { method: 'POST' });
      if (res.ok) fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await authFetch(`/api/admin/reject/${id}`, { method: 'POST' });
      if (res.ok) fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6">
      <h2 className="text-xl font-extrabold text-[#8e4e08] mb-6 flex items-center gap-2">
        <Check className="w-5 h-5" />
        Admin Panel
      </h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-[#dc8e47]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <>
          {/* Pending Users */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
            <div className="px-4 py-3 bg-[#ffdcc2] border-b border-[#d8c2b3]/40">
              <h3 className="font-semibold text-sm text-[#8e4e08]">Pending Approvals</h3>
              <p className="text-xs text-slate-500">{pending.length} waiting</p>
            </div>
            {pending.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">No pending users</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pending.map((u) => (
                  <div key={u.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Registered {formatDate(u.created_at)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(u.id)}
                        disabled={actionLoading === u.id}
                        className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-colors disabled:opacity-50"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReject(u.id)}
                        disabled={actionLoading === u.id}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors disabled:opacity-50"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Family Members */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 bg-[#ffdcc2] border-b border-[#d8c2b3]/40 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#8e4e08]" />
              <h3 className="font-semibold text-sm text-[#8e4e08]">Family Members</h3>
            </div>
            {members.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">No members yet</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {members.map((m) => (
                  <div key={m.id} className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#ffdcc2] flex items-center justify-center text-[#8e4e08] font-bold text-sm">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-slate-800">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      m.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}