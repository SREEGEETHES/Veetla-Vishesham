import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  UserPlus,
  Calendar,
  Sparkles,
  Send,
  Users,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cake,
  Heart,
  Bot,
  Globe,
  Sliders,
  LogOut,
  Plus,
  PhoneCall,
  Check,
  Edit2,
  HelpCircle,
  Smartphone
} from 'lucide-react';
import { User, AppConfig, MilestoneEvent, Language } from '../types';
import { soundCtrl } from '../utils/audio';

interface MasterAdminConsoleProps {
  users: User[];
  currentUser: User;
  appConfig: AppConfig;
  milestones: MilestoneEvent[];
  language: Language;
  onUpdateAppConfig: (config: AppConfig) => void;
  onOnboardUser: (newUser: User) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUser?: (updated: User) => void;
  onAddMilestone: (event: MilestoneEvent) => void;
  onDeleteMilestone: (eventId: string) => void;
  onTriggerTelegramCall: (reminderId?: string, title?: string, assignee?: string) => void;
  onClose: () => void;
}

export const MasterAdminConsole: React.FC<MasterAdminConsoleProps> = ({
  users,
  currentUser,
  appConfig,
  milestones,
  language,
  onUpdateAppConfig,
  onOnboardUser,
  onDeleteUser,
  onUpdateUser,
  onAddMilestone,
  onDeleteMilestone,
  onTriggerTelegramCall,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'milestones' | 'onboarding' | 'telegram_api'>('milestones');

  // Notification / Feedback banner
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Milestones / Birthdays / Anniversaries Form State
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');
  const [milestoneType, setMilestoneType] = useState<'birthday' | 'anniversary' | 'visit' | 'rule' | 'home'>('birthday');
  const [milestoneMandatory, setMilestoneMandatory] = useState(true);

  // 2. User Onboarding Form State
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRelationship, setNewRelationship] = useState('Mother');
  const [newRole, setNewRole] = useState<'member' | 'master'>('member');
  const [newPhone, setNewPhone] = useState('');
  const [newTelegramHandle, setNewTelegramHandle] = useState('');
  const [newCallMeBotKey, setNewCallMeBotKey] = useState('');
  const [newLanguage, setNewLanguage] = useState<Language>('en');
  // Master can see PIN of everyone by default
  const [showPasswords, setShowPasswords] = useState(true);

  // Inline PIN Edit modal state
  const [editingUserPin, setEditingUserPin] = useState<{ user: User; newPin: string } | null>(null);

  // 3. API Keys & Telegram Form State
  const [callMeBotKey, setCallMeBotKey] = useState(appConfig.callMeBotApiKey || '');
  const [telegramUsername, setTelegramUsername] = useState(appConfig.telegramUsername || '');
  const [telegramPhone, setTelegramPhone] = useState(appConfig.telegramPhone || '');
  const [geminiApiKey, setGeminiApiKey] = useState(appConfig.geminiApiKey || '');
  const [familyName, setFamilyName] = useState(appConfig.familyName || 'My Family');
  const [testCallRecipient, setTestCallRecipient] = useState(currentUser.name);
  const [testChoreMessage, setTestChoreMessage] = useState('Time for evening medication');

  const showBanner = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Submit Milestone
  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim() || !milestoneDate) {
      showBanner('Please provide a title and date for the persistent milestone.', 'error');
      return;
    }

    const newMilestone: MilestoneEvent = {
      id: 'event-' + Date.now(),
      title: milestoneTitle.trim(),
      date: milestoneDate,
      daysRemaining: 'Upcoming',
      type: milestoneType,
      personNames: 'Everyone',
      description: 'Family celebration milestone',
      isMandatory: milestoneMandatory
    };

    onAddMilestone(newMilestone);
    soundCtrl.playCelebrationChime();
    showBanner(`Milestone "${newMilestone.title}" saved! All family members will receive calls on this date.`);

    // Reset Form
    setMilestoneTitle('');
    setMilestoneDate('');
  };

  // Submit Onboard User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newUsername.trim() || !newPassword.trim()) {
      showBanner('Full name, username, and 4-digit PIN are required.', 'error');
      return;
    }

    const cleanUsername = newUsername.trim().toLowerCase().replace(/\s+/g, '');
    const exists = users.some((u) => u.username.toLowerCase() === cleanUsername);
    if (exists) {
      showBanner(`Username "@${cleanUsername}" is already in use by another family member.`, 'error');
      return;
    }

    const newUser: User = {
      id: 'user-' + Date.now(),
      username: cleanUsername,
      name: newFullName.trim(),
      password: newPassword.trim(),
      role: newRole,
      relationship: newRelationship,
      phone: newPhone.trim() || undefined,
      telegramUsername: newTelegramHandle.trim() || undefined,
      callMeBotApiKey: newCallMeBotKey.trim() || undefined,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      language: newLanguage
    };

    onOnboardUser(newUser);
    soundCtrl.playCelebrationChime();
    showBanner(`Family member ${newUser.name} (@${newUser.username}) onboarded with PIN ${newUser.password}!`);

    // Reset Form
    setNewFullName('');
    setNewUsername('');
    setNewPassword('');
    setNewPhone('');
    setNewTelegramHandle('');
    setNewCallMeBotKey('');
  };

  // Submit API Settings
  const handleSaveApiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppConfig = {
      ...appConfig,
      callMeBotApiKey: callMeBotKey.trim() || '',
      telegramUsername: telegramUsername.trim() || '',
      telegramPhone: telegramPhone.trim() || '',
      geminiApiKey: geminiApiKey.trim() || '',
      familyName: familyName.trim() || 'My Family'
    };

    onUpdateAppConfig(updated);
    soundCtrl.playCelebrationChime();
    showBanner('Master Telegram & API credentials saved to persistent database!');
  };

  // Trigger Instant Test Call
  const handleDispatchTestCall = () => {
    onTriggerTelegramCall(undefined, testChoreMessage, testCallRecipient);
    showBanner(`Dispatched automated reminder call for "${testChoreMessage}" to ${testCallRecipient}!`);
  };

  // Save PIN change
  const handleSavePinChange = () => {
    if (!editingUserPin || !editingUserPin.newPin.trim()) return;
    const updated = { ...editingUserPin.user, password: editingUserPin.newPin.trim() };
    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    showBanner(`PIN updated to ${updated.password} for ${updated.name}!`);
    setEditingUserPin(null);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col antialiased">
      {/* 1. Master Console Top Header */}
      <header className="bg-[#1E293B] border-b border-slate-700/80 px-4 sm:px-8 py-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Shield className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">
                  FamilyOS Master Control Station
                </h1>
                <span className="text-[10px] bg-amber-500/20 border border-amber-500/50 text-amber-300 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  /admin
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Persistent Milestones • Member Onboarding & PIN Access • Telegram API Strategy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloud Sync Active</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-600 active:scale-95 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-amber-400" />
              <span>Back to Family View</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Status Banner */}
      {statusMessage && (
        <div
          className={`px-4 py-3 text-center text-xs font-extrabold transition-all border-b ${
            statusMessage.type === 'success'
              ? 'bg-emerald-900/90 text-emerald-200 border-emerald-700'
              : 'bg-red-900/90 text-red-200 border-red-700'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="bg-[#162032] border-b border-slate-700/60 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto py-2.5 no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setActiveTab('milestones');
              soundCtrl.playPreviewTone();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'milestones'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>1. Birthdays & Anniversaries</span>
            <span className="text-[10px] bg-slate-950/30 px-1.5 py-0.5 rounded-full">
              {milestones.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('onboarding');
              soundCtrl.playPreviewTone();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'onboarding'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>2. Onboard Family Members & PINs</span>
            <span className="text-[10px] bg-slate-950/30 px-1.5 py-0.5 rounded-full">
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('telegram_api');
              soundCtrl.playPreviewTone();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'telegram_api'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>3. Telegram & API Hub</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-8 flex-1">
        {/* TAB 1: PERSISTENT BIRTHDAYS & ANNIVERSARIES */}
        {activeTab === 'milestones' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="bg-slate-800/60 border border-slate-700 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Cake className="w-5 h-5 text-amber-400" />
                  Persistent Family Milestones & Key Dates
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Assigned exclusively by Master Admin. Saved persistently in Firestore database for all family members.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Milestone Creation Form */}
              <div className="lg:col-span-5 bg-[#1E293B] border border-slate-700 p-6 rounded-3xl shadow-xl">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Permanent Milestone
                </h3>

                <form onSubmit={handleSaveMilestone} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Event Title (e.g. Grandma's 75th Birthday, Parents' Silver Jubilee)
                    </label>
                    <input
                      type="text"
                      value={milestoneTitle}
                      onChange={(e) => setMilestoneTitle(e.target.value)}
                      placeholder="e.g. Leo's 14th Birthday"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={milestoneDate}
                        onChange={(e) => setMilestoneDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Category
                      </label>
                      <select
                        value={milestoneType}
                        onChange={(e) =>
                          setMilestoneType(
                            e.target.value as 'birthday' | 'anniversary' | 'visit' | 'rule' | 'home'
                          )
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                      >
                        <option value="birthday">Birthday 🎂</option>
                        <option value="anniversary">Wedding Anniversary ❤️</option>
                        <option value="visit">Family Visit / Gathering 🏡</option>
                        <option value="rule">Family Tradition / Rule 📜</option>
                        <option value="home">Home Maintenance 🛠️</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-700/80 p-3.5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Participants</p>
                      <p className="text-[11px] text-amber-400 font-medium">Everyone (All family members receive calls on this date)</p>
                    </div>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2.5 py-1 rounded-full border border-amber-500/40">
                      WHOLE FAMILY
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="mandatoryCheckbox"
                      checked={milestoneMandatory}
                      onChange={(e) => setMilestoneMandatory(e.target.checked)}
                      className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="mandatoryCheckbox" className="text-xs text-slate-300 cursor-pointer">
                      High Priority Milestone (Highlights on all family dashboards)
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Save to Persistent Database</span>
                  </button>
                </form>
              </div>

              {/* Milestone Active List */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white">
                    Persistent Milestones Roster ({milestones.length})
                  </h3>
                  <span className="text-xs text-slate-400">
                    Syncs directly across all family devices
                  </span>
                </div>

                {milestones.length === 0 ? (
                  <div className="bg-[#1E293B] border border-slate-700/80 p-8 rounded-3xl text-center space-y-2">
                    <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
                    <h4 className="font-bold text-sm text-slate-300">No Milestones Recorded Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Use the form on the left to record family birthdays, wedding anniversaries, or traditions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {milestones.map((m) => (
                      <div
                        key={m.id}
                        className="bg-[#1E293B] border border-slate-700/80 p-4 rounded-2xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${
                              m.type === 'birthday'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : m.type === 'anniversary'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                            }`}
                          >
                            {m.type === 'birthday' ? <Cake className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-white">{m.title}</h4>
                              {m.isMandatory && (
                                <span className="text-[9px] bg-rose-500/20 text-rose-300 font-extrabold px-2 py-0.5 rounded-full">
                                  PRIORITY
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Date: <span className="text-amber-300 font-mono font-bold">{m.date}</span>
                              {m.personNames && ` • For: ${m.personNames}`}
                            </p>
                            {m.description && (
                              <p className="text-xs text-slate-300/80 italic mt-1">
                                "{m.description}"
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onDeleteMilestone(m.id);
                            showBanner(`Milestone "${m.title}" deleted.`);
                          }}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                          title="Delete Milestone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER ONBOARDING & PIN ACCESS */}
        {activeTab === 'onboarding' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="bg-slate-800/60 border border-slate-700 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-400" />
                  Family Member Onboarding & Credentials Control
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Master Admin can see everyone's PIN, reset member passwords, configure personal Telegram routing, and add new family accounts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Onboarding Form */}
              <div className="lg:col-span-5 bg-[#1E293B] border border-slate-700 p-6 rounded-3xl shadow-xl">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Register New Family Member
                </h3>

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="e.g. Grandma Kalyani, Leo, Priya"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Username (Handle)
                      </label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="e.g. grandma"
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Access PIN (4 digits)
                      </label>
                      <input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="e.g. 5566"
                        maxLength={6}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-mono font-bold text-xs focus:border-amber-400 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Family Role
                      </label>
                      <select
                        value={newRelationship}
                        onChange={(e) => setNewRelationship(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Grandfather">Grandfather</option>
                        <option value="Grandmother">Grandmother</option>
                        <option value="Uncle">Uncle</option>
                        <option value="Aunt">Aunt</option>
                        <option value="Guardian">Guardian</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Permission Level
                      </label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as 'member' | 'master')}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                      >
                        <option value="member">Standard Family Member</option>
                        <option value="master">Master Admin (Full Access)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Personal Phone (Calls)
                      </label>
                      <input
                        type="text"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="+919876543210"
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Telegram Handle
                      </label>
                      <input
                        type="text"
                        value={newTelegramHandle}
                        onChange={(e) => setNewTelegramHandle(e.target.value)}
                        placeholder="@username"
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Individual CallMeBot Key (Optional for dedicated personal phone)
                    </label>
                    <input
                      type="text"
                      value={newCallMeBotKey}
                      onChange={(e) => setNewCallMeBotKey(e.target.value)}
                      placeholder="e.g. 987654 (Optional personal key)"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      If left blank, FamilyOS will route calls via the household Telegram API key.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Preferred App Language
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewLanguage('en')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                          newLanguage === 'en'
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewLanguage('ta')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                          newLanguage === 'ta'
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}
                      >
                        தமிழ் (Tamil)
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 stroke-[2.5]" />
                    <span>Create Family Member Account</span>
                  </button>
                </form>
              </div>

              {/* Roster with Clear PINs Visible for Master */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white">
                    Registered Family Roster ({users.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPasswords ? 'Hide PINs' : 'Reveal PINs'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="bg-[#1E293B] border border-slate-700/80 p-4 rounded-2xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-slate-600 flex-shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white">{u.name}</h4>
                            <span
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                u.role === 'master'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {u.role === 'master' ? 'MASTER ADMIN' : 'MEMBER'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            @{u.username} • {u.relationship} • {u.phone || 'No phone'}
                          </p>

                          {/* Telegram Voice Status */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-bold text-slate-400">Telegram Voice:</span>
                            <span className="text-[11px] font-mono text-sky-300">
                              {u.telegramUsername || u.phone || 'Not linked'}
                            </span>
                            {u.callMeBotApiKey ? (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                                Personal Key
                              </span>
                            ) : (
                              <span className="text-[9px] bg-slate-800 text-slate-400 font-medium px-1.5 py-0.2 rounded">
                                Household Key
                              </span>
                            )}
                          </div>

                          {/* Master can see and edit PIN */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] font-bold text-slate-400">Login PIN:</span>
                            <span className="font-mono font-black text-xs text-amber-300 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-amber-500/40 tracking-wider">
                              {showPasswords ? (u.password || '1234') : '••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingUserPin({ user: u, newPin: u.password || '1234' })}
                              className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 font-bold underline decoration-dotted ml-1 cursor-pointer"
                            >
                              <Edit2 className="w-2.5 h-2.5" /> Change PIN
                            </button>
                          </div>
                        </div>
                      </div>

                      {u.role !== 'master' && (
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteUser(u.id);
                            showBanner(`User ${u.name} removed from roster.`);
                          }}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Inline PIN Change Modal */}
            {editingUserPin && (
              <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                <div className="bg-[#1E293B] border border-slate-600 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                  <h4 className="font-black text-base text-white flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-amber-400" />
                    Change PIN for {editingUserPin.user.name}
                  </h4>
                  <p className="text-xs text-slate-400">
                    As Master Admin, you can set a new 4-digit PIN for any family member.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      New 4-Digit PIN
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={editingUserPin.newPin}
                      onChange={(e) =>
                        setEditingUserPin({ ...editingUserPin, newPin: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-amber-300 font-mono font-bold text-lg text-center tracking-widest focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingUserPin(null)}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePinChange}
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
                    >
                      Update PIN
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TELEGRAM & API HUB (EXPLAINER & CREDENTIALS) */}
        {activeTab === 'telegram_api' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Direct Answer to User's Question */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-2 border-amber-500/50 p-6 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black flex-shrink-0">
                  <HelpCircle className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Is one CallMeBot API key enough for the whole family, or does each person need their own?
                  </h3>
                  <p className="text-xs text-amber-300 font-bold">
                    Official Answer & Dual-Routing Setup in FamilyOS
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-200 leading-relaxed space-y-3 pt-2 border-t border-slate-700/60">
                <p>
                  Here is exactly how Telegram and CallMeBot work, and how FamilyOS solves it:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-700 space-y-1.5">
                    <p className="font-extrabold text-[#3AC9FA] flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4" /> Option 1: One Shared Family API Key (Quickest)
                    </p>
                    <p className="text-[11px] text-slate-300">
                      If you only configure <strong>one API key</strong> below in the Master Admin console (e.g. registered on Dad's or Mom's phone), all family automated reminder calls will ring to that central household Telegram account. The bot announces who the chore is for (e.g. <em>"Hello Leo..."</em>).
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900/90 rounded-2xl border border-amber-500/50 space-y-1.5">
                    <p className="font-extrabold text-amber-400 flex items-center gap-1.5">
                      <PhoneCall className="w-4 h-4" /> Option 2: Individual Phone Routing (Recommended)
                    </p>
                    <p className="text-[11px] text-slate-300">
                      If each family member wants calls to <strong>ring privately on their own personal phone/device</strong>, each person takes 10 seconds to open Telegram, message <code className="text-[#3AC9FA]">@CallMeBot_call</code>, and get their individual API key. You can save their personal handle/key in the <strong>Onboard Family Members</strong> tab. FamilyOS automatically calls their personal phone first!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Telegram Completion Explanation */}
            <div className="bg-slate-800/60 border border-slate-700 p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                How Telegram Bot Handles Chore Completion
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                When a voice call is placed to a member, they can confirm completion directly on their screen with the green <strong>"Mark Chore as Completed"</strong> button. This instantly syncs with Firestore, changes the chore status to completed, and prevents repeated calls.
              </p>
            </div>

            {/* API Configuration Form */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 bg-[#1E293B] border border-slate-700 p-6 rounded-3xl shadow-xl">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-2">
                  <Sliders className="w-4 h-4" /> Master Household Credentials & Bot Parameters
                </h3>

                <form onSubmit={handleSaveApiSettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      CallMeBot Primary API Key (For Automated Voice Calls)
                    </label>
                    <input
                      type="text"
                      value={callMeBotKey}
                      onChange={(e) => setCallMeBotKey(e.target.value)}
                      placeholder="e.g. 123456 (from @CallMeBot_call in Telegram)"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Free Telegram Bot: Message <code className="text-[#3AC9FA]">@CallMeBot_call</code> on Telegram to obtain.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Master Telegram Username
                      </label>
                      <input
                        type="text"
                        value={telegramUsername}
                        onChange={(e) => setTelegramUsername(e.target.value)}
                        placeholder="@username"
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Master Telegram Phone
                      </label>
                      <input
                        type="text"
                        value={telegramPhone}
                        onChange={(e) => setTelegramPhone(e.target.value)}
                        placeholder="+919840123456"
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Gemini AI API Key (For Voice Chore Parsing)
                    </label>
                    <input
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Family Household Name
                    </label>
                    <input
                      type="text"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder="e.g. Alexander & Priya Household"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Save Master Settings</span>
                  </button>
                </form>
              </div>

              {/* Test Voice Call Dispatcher */}
              <div className="lg:col-span-5 bg-[#1E293B] border border-slate-700 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                    <PhoneCall className="w-4 h-4" /> Live Call Dispatch Tester
                  </h3>
                  <p className="text-xs text-slate-300 mb-4">
                    Send an immediate test voice call to verify Telegram ringing, Tamil/English emotional voice greeting, and task completion sync.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Select Recipient Member
                      </label>
                      <select
                        value={testCallRecipient}
                        onChange={(e) => setTestCallRecipient(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                      >
                        {users.map((u) => (
                          <option key={u.id} value={u.name}>
                            {u.name} ({u.relationship}) {u.phone ? `• ${u.phone}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Spoken Chore Message
                      </label>
                      <input
                        type="text"
                        value={testChoreMessage}
                        onChange={(e) => setTestChoreMessage(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={handleDispatchTestCall}
                    className="w-full py-3 bg-[#229ED9] hover:bg-[#1D8AC0] text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Dispatch Voice Call Now</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
