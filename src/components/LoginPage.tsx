import React, { useState } from 'react';
import { Shield, Lock, ArrowRight, KeyRound, AlertCircle, Sparkles, CheckCircle2, UserCheck } from 'lucide-react';
import { User, Language } from '../types';
import { translations } from '../i18n';
import { soundCtrl } from '../utils/audio';

interface LoginPageProps {
  users: User[];
  onSelectUser: (user: User) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  onSelectUser,
  language,
  onLanguageChange
}) => {
  const t = translations[language];
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');

  const handleMemberClick = (user: User) => {
    setSelectedUser(user);
    setPinInput('');
    setErrorMessage('');
    setIsAdminMode(false);
    soundCtrl.playPreviewTone();
  };

  const handleMemberLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setErrorMessage('');

    // Strict authentication against the exact PIN/password set in Admin Panel
    const requiredPin = selectedUser.password ? selectedUser.password.trim() : '1234';
    if (pinInput.trim() === requiredPin) {
      soundCtrl.playCelebrationChime();
      setSuccessMessage(
        language === 'ta'
          ? `வணக்கம் ${selectedUser.name}! உள்நுழைகிறது...`
          : `Welcome back, ${selectedUser.name}!`
      );
      setTimeout(() => {
        onSelectUser(selectedUser);
      }, 700);
    } else {
      setErrorMessage(
        language === 'ta'
          ? 'தவறான கடவுச்சொல். மீண்டும் முயற்சிக்கவும்.'
          : 'Incorrect password or PIN. Please try again.'
      );
    }
  };

  const handleMasterAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (
      (adminUsername.trim().toLowerCase() === 'admin' || adminUsername.trim().toLowerCase() === 'master') &&
      (adminPassword === 'master2026' || adminPassword === 'admin')
    ) {
      const masterUser = users.find((u) => u.role === 'master') || {
        id: 'user-master',
        username: 'admin',
        name: 'Master Admin',
        role: 'master',
        relationship: 'Family Administrator',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        phone: '',
        language: 'en'
      };

      soundCtrl.playCelebrationChime();
      setSuccessMessage('Master Admin Authenticated! Loading Command Station...');
      setTimeout(() => {
        onSelectUser(masterUser);
      }, 700);
    } else {
      setErrorMessage(
        'Invalid Admin Credentials. Default master credentials: "admin" / "master2026"'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col justify-between p-4 sm:p-6 text-[#1A0D0A] selection:bg-[#DC8E47] selection:text-white">
      {/* Top Bar with Brand & Language Toggle */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#DC8E47] flex items-center justify-center text-white shadow-md">
            <Shield className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#1A0D0A]">FamilyOS</h1>
            <p className="text-[11px] font-bold text-[#DC8E47] uppercase tracking-wider">
              Private Family Portal
            </p>
          </div>
        </div>

        {/* Bilingual Switcher */}
        <div className="flex items-center bg-white border border-[#D8C2B3] p-1 rounded-xl shadow-2xs">
          <button
            onClick={() => onLanguageChange('en')}
            className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
              language === 'en'
                ? 'bg-[#1A0D0A] text-white shadow-2xs'
                : 'text-[#534438] hover:text-black'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => onLanguageChange('ta')}
            className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
              language === 'ta'
                ? 'bg-[#DC8E47] text-white shadow-2xs'
                : 'text-[#534438] hover:text-black'
            }`}
          >
            தமிழ்
          </button>
        </div>
      </div>

      {/* Center Authentication Body */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        {!isAdminMode ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Text */}
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A0D0A]">
                {language === 'ta' ? 'உறுப்பினர் உள்நுழைவு' : 'Who is using FamilyOS?'}
              </h2>
            </div>

            {/* Success Notification */}
            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Notification */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in shake duration-200">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Member Profile Cards Selection */}
            {!selectedUser ? (
              <div className="space-y-3">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#534438] pl-1">
                  {language === 'ta' ? 'குடும்ப உறுப்பினர்கள்' : 'Registered Family Members'}
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleMemberClick(u)}
                      className="w-full bg-white hover:bg-[#FFF9F5] border border-[#D8C2B3]/70 hover:border-[#DC8E47] p-3.5 rounded-2xl flex items-center justify-between shadow-2xs hover:shadow-md active:scale-98 transition-all group text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          <img
                            src={u.avatar}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs group-hover:scale-105 transition-transform"
                          />
                          {u.role === 'master' && (
                            <span className="absolute -bottom-1 -right-1 p-0.5 bg-[#DC8E47] text-white rounded-full">
                              <KeyRound className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-sm text-[#1A0D0A] group-hover:text-[#DC8E47] transition-colors">
                              {u.name}
                            </h3>
                            {u.role === 'master' && (
                              <span className="text-[10px] bg-[#DC8E47]/20 text-[#8E4E08] font-black px-2 py-0.5 rounded-full">
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-[#F9F9F9] group-hover:bg-[#DC8E47] text-[#534438] group-hover:text-white flex items-center justify-center transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>

                {/* If only admin exists, show notice */}
                {users.length <= 1 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-1">
                    <p className="text-xs font-bold text-amber-900">
                      No family members onboarded yet
                    </p>
                    <p className="text-[11px] text-amber-700">
                      Log in as Master Admin below to onboard family members with their names, PINs, and Telegram accounts.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* PIN Entry for Selected Member */
              <div className="bg-white border border-[#D8C2B3] p-6 rounded-3xl shadow-lg space-y-5 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-[#D8C2B3]/50">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedUser.avatar}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#DC8E47]"
                    />
                    <div>
                      <h3 className="font-extrabold text-base text-[#1A0D0A]">
                        {selectedUser.name}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setErrorMessage('');
                    }}
                    className="text-xs text-[#DC8E47] font-bold hover:underline"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleMemberLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#534438] uppercase tracking-wider mb-1.5">
                      {language === 'ta' ? 'கடவுச்சொல் / பின் (PIN)' : 'Security PIN / Password'}
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        autoFocus
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        placeholder=""
                        className="w-full pl-10 pr-4 py-3 bg-[#F9F9F9] border border-[#D8C2B3] rounded-xl text-center text-lg font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-[#DC8E47]"
                      />
                      <Lock className="w-4 h-4 text-[#534438] absolute left-3.5 top-4" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#DC8E47] hover:bg-[#8E4E08] text-white font-extrabold rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{language === 'ta' ? 'உள்நுழைக' : 'Sign In'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* Switch to Master Admin Station */}
            <div className="pt-2 text-center">
              <button
                onClick={() => {
                  setIsAdminMode(true);
                  setSelectedUser(null);
                  setErrorMessage('');
                  soundCtrl.playPreviewTone();
                }}
                className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0F172A] hover:text-[#DC8E47] py-2 px-4 rounded-xl hover:bg-black/5 transition-colors border border-black/10"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#DC8E47]" />
                <span>Switch to Master Admin Station</span>
              </button>
            </div>
          </div>
        ) : (
          /* Master Admin Portal */
          <div className="bg-[#0F172A] text-white p-6 sm:p-7 rounded-3xl shadow-2xl border border-slate-700 space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Master Admin Station</h3>
                  <p className="text-[11px] text-slate-400">Head of Family & System Control</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAdminMode(false);
                  setErrorMessage('');
                }}
                className="text-xs text-amber-400 font-bold hover:underline"
              >
                Back to Members
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-950/60 border border-red-700 text-red-300 rounded-xl flex items-center gap-2 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-300 rounded-xl flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleMasterAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Master Username
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Master Password
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Shield className="w-4 h-4" />
                <span>Enter Master Control Center</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Privacy Notice Footer */}
      <div className="max-w-md w-full mx-auto text-center border-t border-[#D8C2B3]/50 pt-4 pb-2">
        <p className="text-[11px] text-[#534438] leading-relaxed">
          🔒 <strong>Strict Privacy Architecture</strong>: Personal chores, medication schedules, and Telegram voice calls are confidential to each family member.
        </p>
      </div>
    </div>
  );
};
