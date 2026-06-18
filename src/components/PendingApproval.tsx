import { useAuth } from '../context/AuthContext';
import { Clock } from 'lucide-react';

export default function PendingApproval() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ffdcc2] to-[#f9f9f9] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 bg-[#dc8e47]/20 rounded-full mx-auto mb-6 flex items-center justify-center">
          <Clock className="w-10 h-10 text-[#dc8e47]" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#8e4e08] mb-2">Welcome, {user?.name}</h2>
        <p className="text-slate-600 text-sm leading-relaxed mb-2">
          Your account is pending admin approval.
        </p>
        <p className="text-slate-500 text-xs leading-relaxed mb-8">
          Please wait for the family admin to approve your access.<br />
          You'll be able to use FamilyOS once approved.
        </p>
        <button
          onClick={logout}
          className="w-full py-3 bg-white border-2 border-[#dc8e47] text-[#8e4e08] font-bold rounded-xl text-sm hover:bg-[#ffdcc2] transition-all"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}