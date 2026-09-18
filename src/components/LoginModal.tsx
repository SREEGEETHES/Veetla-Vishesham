import React, { useState } from 'react';
import { Shield, User as UserIcon, Lock, CheckCircle2, KeyRound, AlertCircle, X } from 'lucide-react';
import { User } from '../types';
import { soundCtrl } from '../utils/audio';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onSelectUser: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSelectUser
}) => {
  const [loginMode, setLoginMode] = useState<'profile' | 'credentials' | 'master'>('profile');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleQuickSwitch = (u: User) => {
    onSelectUser(u);
    soundCtrl.playPreviewTone();
    setSuccessMessage(`Signed in as ${u.name}`);
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 600);
  };

  const handleCredentialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const found = users.find(
      (u) =>
        u.username.toLowerCase() === usernameInput.trim().toLowerCase() &&
        (u.password === passwordInput || !u.password || passwordInput === '1234')
    );

    if (found) {
      onSelectUser(found);
      soundCtrl.playCelebrationChime();
      setSuccessMessage(`Welcome back, ${found.name}!`);
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 700);
    } else {
      setErrorMessage('Invalid username or password. Default PIN is 1234 or your assigned password.');
    }
  };

  const handleMasterLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Master login credentials
    if (
      (usernameInput.trim().toLowerCase() === 'admin' || usernameInput.trim().toLowerCase() === 'master') &&
      (passwordInput === 'master2026' || passwordInput === 'admin')
    ) {
      const masterUser = users.find((u) => u.role === 'master') || {
        id: 'usr-master',
        username: 'admin',
        name: 'Alexander (Master Admin)',
        role: 'master',
        relationship: 'Head of Family',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      };
      onSelectUser(masterUser);
      soundCtrl.playCelebrationChime();
      setSuccessMessage('Master Admin Access Granted!');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 700);
    } else {
      setErrorMessage('Invalid Master credentials. Use username: "admin" and password: "master2026"');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[#D8C2B3] animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#D8C2B3]/50 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#DC8E47]/20 text-[#8E4E08] rounded-xl">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1A0D0A]">
                FamilyOS Sign In
              </h3>
              <p className="text-[11px] text-[#534438]">
                Current: <span className="font-bold text-[#8E4E08]">{currentUser.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#534438] hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-[#F3F3F3] rounded-xl p-1 mb-4">
          <button
            onClick={() => {
              setLoginMode('profile');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              loginMode === 'profile'
                ? 'bg-white text-[#1A0D0A] shadow-xs'
                : 'text-[#534438] hover:text-[#1A0D0A]'
            }`}
          >
            Family Profiles
          </button>
          <button
            onClick={() => {
              setLoginMode('credentials');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              loginMode === 'credentials'
                ? 'bg-white text-[#1A0D0A] shadow-xs'
                : 'text-[#534438] hover:text-[#1A0D0A]'
            }`}
          >
            Login Credentials
          </button>
          <button
            onClick={() => {
              setLoginMode('master');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              loginMode === 'master'
                ? 'bg-[#8E4E08] text-white shadow-xs'
                : 'text-[#534438] hover:text-[#1A0D0A]'
            }`}
          >
            Master Admin
          </button>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 text-[#BA1A1A] rounded-xl text-xs font-bold flex items-center gap-2 border border-red-200 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-[#BA1A1A]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Mode 1: Quick Profile Switch */}
        {loginMode === 'profile' && (
          <div className="space-y-3">
            <p className="text-xs text-[#534438]">
              Select your family profile to access personalized chores, vault items, and voice notifications:
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleQuickSwitch(user)}
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all text-left ${
                    currentUser.id === user.id
                      ? 'border-[#DC8E47] bg-[#FFDCC2]/30 shadow-xs'
                      : 'border-[#D8C2B3]/60 bg-white hover:border-[#DC8E47]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#DC8E47]"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-[#1A0D0A] flex items-center gap-1.5">
                        {user.name}
                        {user.role === 'master' && (
                          <span className="bg-[#DC8E47] text-white text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase">
                            Admin
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-[#534438]">
                        @{user.username} • {user.relationship}
                      </p>
                    </div>
                  </div>

                  {currentUser.id === user.id ? (
                    <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs text-[#8E4E08] font-bold">
                      Switch →
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mode 2: Credential Login */}
        {loginMode === 'credentials' && (
          <form onSubmit={handleCredentialLogin} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[#534438] block mb-1">
                Username / Login ID
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. alexander, priya, leo"
                className="w-full p-2.5 text-sm rounded-xl border border-[#D8C2B3] focus:ring-2 focus:ring-[#DC8E47] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#534438] block mb-1">
                Password or 4-digit PIN
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password (default 1234)"
                className="w-full p-2.5 text-sm rounded-xl border border-[#D8C2B3] focus:ring-2 focus:ring-[#DC8E47] focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#DC8E47] hover:brightness-105 text-white font-bold rounded-xl text-sm shadow-xs active:scale-95 transition-all"
            >
              Sign In
            </button>
          </form>
        )}

        {/* Mode 3: Master Admin Login */}
        {loginMode === 'master' && (
          <form onSubmit={handleMasterLogin} className="space-y-3">
            <div className="p-3 bg-[#FFDCC2]/40 rounded-xl border border-[#DC8E47]/40 text-xs text-[#8E4E08]">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Shield className="w-4 h-4" /> Master Admin Permissions
              </div>
              <p className="text-[11px] text-[#534438] leading-tight">
                Master Admin can onboard family members, set Telegram Call API keys, configure Gemini, and schedule mandatory events.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-[#534438] block mb-1">
                Master Username
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="admin"
                className="w-full p-2.5 text-sm rounded-xl border border-[#D8C2B3] focus:ring-2 focus:ring-[#8E4E08] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#534438] block mb-1">
                Master Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="master2026"
                className="w-full p-2.5 text-sm rounded-xl border border-[#D8C2B3] focus:ring-2 focus:ring-[#8E4E08] focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#8E4E08] hover:brightness-110 text-white font-bold rounded-xl text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" /> Sign In as Master Admin
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
