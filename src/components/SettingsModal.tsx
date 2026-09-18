import React, { useState } from 'react';
import {
  X,
  KeyRound,
  UserPlus,
  Shield,
  CheckCircle2,
  Users,
  Sliders,
  Globe,
  Phone,
  Calendar,
  Sparkles,
  Send,
  Eye,
  EyeOff
} from 'lucide-react';
import { User, AppConfig, MilestoneEvent, Language } from '../types';
import { translations } from '../i18n';
import { soundCtrl } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  users: User[];
  currentUser: User;
  appConfig: AppConfig;
  onUpdateAppConfig: (config: AppConfig) => void;
  onOnboardUser: (newUser: User) => void;
  onAddMandatoryEvent: (event: MilestoneEvent) => void;
  onTriggerTestCall: (title?: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  onLanguageChange,
  users,
  currentUser,
  appConfig,
  onUpdateAppConfig,
  onOnboardUser,
  onAddMandatoryEvent,
  onTriggerTestCall
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'apikeys' | 'family' | 'mandatory' | 'system'>('apikeys');

  // API Keys state
  const [callMeBotKey, setCallMeBotKey] = useState(appConfig.callMeBotApiKey || '');
  const [telegramUsername, setTelegramUsername] = useState(appConfig.telegramUsername || '');
  const [telegramPhone, setTelegramPhone] = useState(appConfig.telegramPhone || '');
  const [geminiApiKey, setGeminiApiKey] = useState(appConfig.geminiApiKey || '');
  const [familyName, setFamilyName] = useState(appConfig.familyName || 'Alexander Family');
  const [apiKeysSaved, setApiKeysSaved] = useState(false);

  // New User Onboarding Form State
  const [showOnboardForm, setShowOnboardForm] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('1234');
  const [newRelationship, setNewRelationship] = useState('Daughter');
  const [newRole, setNewRole] = useState<'master' | 'member'>('member');
  const [newPhone, setNewPhone] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Mandatory event state
  const [eventTitle, setEventTitle] = useState('');
  const [eventPersons, setEventPersons] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState<'birthday' | 'anniversary'>('birthday');

  if (!isOpen) return null;

  const isMaster = currentUser.role === 'master';

  // Save API keys
  const handleSaveApiKeys = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAppConfig({
      callMeBotApiKey: callMeBotKey.trim(),
      telegramUsername: telegramUsername.trim(),
      telegramPhone: telegramPhone.trim(),
      geminiApiKey: geminiApiKey.trim(),
      familyName: familyName.trim()
    });
    setApiKeysSaved(true);
    soundCtrl.playCelebrationChime();
    setTimeout(() => setApiKeysSaved(false), 2000);
  };

  // Onboard New User
  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newUsername.trim()) return;

    const user: User = {
      id: 'usr-' + Date.now(),
      name: newFullName.trim(),
      username: newUsername.trim().toLowerCase(),
      password: newPassword.trim() || '1234',
      relationship: newRelationship,
      role: newRole,
      phone: newPhone.trim(),
      avatar:
        newRelationship === 'Daughter'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : newRelationship === 'Son'
          ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
          : newRelationship === 'Grandmother'
          ? 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    };

    onOnboardUser(user);
    soundCtrl.playCelebrationChime();
    setNewFullName('');
    setNewUsername('');
    setNewPassword('1234');
    setNewPhone('');
    setShowOnboardForm(false);
  };

  // Add Mandatory Event
  const handleAddMandatorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate) return;

    const eventDateObj = new Date(eventDate);
    const now = new Date();
    const diffTime = eventDateObj.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysRemaining = diffDays <= 0 ? 'Today' : `${diffDays} days to go`;

    const newMandatory: MilestoneEvent = {
      id: 'mandatory-' + Date.now(),
      title: eventTitle.trim(),
      personNames: eventPersons.trim() || eventTitle.trim(),
      date: eventDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      daysRemaining,
      type: eventType,
      description: `Mandatory family ${eventType} celebration.`,
      isMandatory: true,
      actionLabel: eventType === 'birthday' ? 'Gift Ideas' : 'Plan Feast'
    };

    onAddMandatoryEvent(newMandatory);
    soundCtrl.playCelebrationChime();
    setEventTitle('');
    setEventPersons('');
    setEventDate('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F9F9F9] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#D8C2B3] max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D8C2B3]/60 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#DC8E47]/20 text-[#8E4E08] rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1A0D0A]">
                FamilyOS Control Center
              </h3>
              <p className="text-[11px] text-[#534438]">
                {isMaster ? 'Master Admin Mode' : `Signed in as ${currentUser.name}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#534438] hover:bg-black/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 bg-[#EFEFEF] rounded-xl p-1 mb-5 text-[11px] font-bold">
          <button
            onClick={() => setActiveTab('apikeys')}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'apikeys'
                ? 'bg-white text-[#1A0D0A] shadow-xs font-black'
                : 'text-[#534438] hover:text-[#1A0D0A]'
            }`}
          >
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('family')}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'family'
                ? 'bg-white text-[#1A0D0A] shadow-xs font-black'
                : 'text-[#534438] hover:text-[#1A0D0A]'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('mandatory')}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'mandatory'
                ? 'bg-white text-[#1A0D0A] shadow-xs font-black'
                : 'text-[#534438] hover:text-[#1A0D0A]'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'system'
                ? 'bg-white text-[#1A0D0A] shadow-xs font-black'
                : 'text-[#534438] hover:text-[#1A0D0A]'
            }`}
          >
            Language
          </button>
        </div>

        {/* Tab 1: API Keys & Telegram Call Setup */}
        {activeTab === 'apikeys' && (
          <form onSubmit={handleSaveApiKeys} className="space-y-4">
            <div className="p-3 bg-[#BDE9FF]/30 rounded-2xl border border-[#3AC9FA]/40 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#006783]">
                <Send className="w-4 h-4" /> Telegram Automated Calls Setup
              </div>
              <p className="text-[#534438] text-[11px] leading-relaxed">
                Automated phone calls are triggered via the Telegram CallMeBot API. Configure your bot token and family credentials below.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-[#534438] block mb-1">
                Family Display Name
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Alexander Family"
                className="w-full p-2.5 text-xs font-bold rounded-xl border border-[#D8C2B3] bg-white focus:ring-2 focus:ring-[#DC8E47] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#534438] block mb-1">
                CallMeBot API Key (Telegram Voice Calls)
              </label>
              <input
                type="text"
                value={callMeBotKey}
                onChange={(e) => setCallMeBotKey(e.target.value)}
                placeholder="e.g. 1928374 or CallMeBot ApiKey"
                className="w-full p-2.5 text-xs font-mono rounded-xl border border-[#D8C2B3] bg-white focus:ring-2 focus:ring-[#DC8E47] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#534438] block mb-1">
                  Telegram Username
                </label>
                <input
                  type="text"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder="@alexander_dad"
                  className="w-full p-2 text-xs rounded-xl border border-[#D8C2B3] bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#534438] block mb-1">
                  Telegram Phone
                </label>
                <input
                  type="text"
                  value={telegramPhone}
                  onChange={(e) => setTelegramPhone(e.target.value)}
                  placeholder="+919840123456"
                  className="w-full p-2 text-xs rounded-xl border border-[#D8C2B3] bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#534438] block mb-1">
                Gemini API Key (Optional AI Insights)
              </label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full p-2.5 text-xs font-mono rounded-xl border border-[#D8C2B3] bg-white focus:ring-2 focus:ring-[#DC8E47] focus:outline-none"
              />
            </div>

            {apiKeysSaved && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>API configuration saved and synced!</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => onTriggerTestCall('Test: Evening BP Tablet Alert')}
                className="flex-1 py-2.5 bg-[#006783] hover:brightness-110 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" /> Test Telegram Call
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#DC8E47] hover:brightness-105 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: User Onboarding & Credential Assignment */}
        {activeTab === 'family' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-sm text-[#1A0D0A]">
                  Family Member Credentials
                </h4>
                <p className="text-[11px] text-[#534438]">
                  Members can log in directly using the login credentials assigned below.
                </p>
              </div>
              <button
                onClick={() => setShowPasswords(!showPasswords)}
                className="p-1.5 text-[#534438] hover:text-[#1A0D0A]"
                title="Toggle Password Visibility"
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* List of Registered Users */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white border border-[#D8C2B3]/60 p-3 rounded-2xl flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border border-[#DC8E47]"
                    />
                    <div>
                      <h5 className="font-bold text-xs text-[#1A0D0A]">
                        {user.name} ({user.relationship})
                      </h5>
                      <p className="text-[10px] text-[#534438]">
                        Login ID: <span className="font-mono font-bold text-[#006783]">@{user.username}</span> • PIN:{' '}
                        <span className="font-mono font-bold">
                          {showPasswords ? user.password || '1234' : '••••'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      user.role === 'master'
                        ? 'bg-[#DC8E47] text-white'
                        : 'bg-[#F3F3F3] text-[#534438]'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              ))}
            </div>

            {/* Onboard New User Button */}
            <button
              onClick={() => setShowOnboardForm(!showOnboardForm)}
              className="w-full py-2.5 border-2 border-dashed border-[#DC8E47] text-[#8E4E08] hover:bg-[#FFDCC2]/20 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              {showOnboardForm ? 'Cancel Onboarding' : 'Onboard New Family Member'}
            </button>

            {/* Onboarding Form */}
            {showOnboardForm && (
              <form
                onSubmit={handleOnboardSubmit}
                className="p-4 bg-white border border-[#DC8E47] rounded-2xl space-y-3 shadow-xs animate-in fade-in"
              >
                <h5 className="font-bold text-xs text-[#8E4E08] uppercase tracking-wider">
                  New Member Credentials & Profile
                </h5>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[#534438] block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="e.g. Maya"
                      className="w-full text-xs font-bold p-2 rounded-lg border border-[#D8C2B3]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#534438] block mb-1">
                      Login Username
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="e.g. maya"
                      className="w-full text-xs font-bold p-2 rounded-lg border border-[#D8C2B3]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[#534438] block mb-1">
                      Password / PIN
                    </label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="1234"
                      className="w-full text-xs font-bold p-2 rounded-lg border border-[#D8C2B3]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#534438] block mb-1">
                      Relationship
                    </label>
                    <select
                      value={newRelationship}
                      onChange={(e) => setNewRelationship(e.target.value)}
                      className="w-full text-xs font-bold p-2 rounded-lg border border-[#D8C2B3]"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Grandmother">Grandmother</option>
                      <option value="Grandfather">Grandfather</option>
                      <option value="Aunt">Aunt</option>
                      <option value="Uncle">Uncle</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#534438] block mb-1">
                    Telegram Phone or Username (for Automated Calls)
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+919840123456 or @username"
                    className="w-full text-xs font-bold p-2 rounded-lg border border-[#D8C2B3]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#DC8E47] hover:brightness-105 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Confirm & Onboard User
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 3: Mandatory Events (Birthdays & Anniversaries) */}
        {activeTab === 'mandatory' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-extrabold text-sm text-[#1A0D0A]">
                Mandatory Family Events
              </h4>
              <p className="text-[11px] text-[#534438]">
                Setup core birthdays and anniversaries. These are prominently pinned and triggered on the family dashboard.
              </p>
            </div>

            <form onSubmit={handleAddMandatorySubmit} className="p-4 bg-white rounded-2xl border border-[#D8C2B3] space-y-3">
              <h5 className="font-bold text-xs text-[#8E4E08] uppercase tracking-wider">
                Schedule Mandatory Milestone
              </h5>

              <div>
                <label className="text-xs font-bold text-[#534438] block mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Leo's 12th Birthday, Paati's 75th Birthday"
                  className="w-full p-2 text-xs font-bold rounded-lg border border-[#D8C2B3]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#534438] block mb-1">
                  Celebrant Names (e.g. Priya & Alexander, Leo)
                </label>
                <input
                  type="text"
                  value={eventPersons}
                  onChange={(e) => setEventPersons(e.target.value)}
                  placeholder="Specific person name(s)"
                  className="w-full p-2 text-xs font-bold rounded-lg border border-[#D8C2B3]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#534438] block mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-2 text-xs font-bold rounded-lg border border-[#D8C2B3]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#534438] block mb-1">
                    Category
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full p-2 text-xs font-bold rounded-lg border border-[#D8C2B3]"
                  >
                    <option value="birthday">Birthday</option>
                    <option value="anniversary">Anniversary</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#8E4E08] hover:brightness-110 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Add Mandatory Event
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Language & System Preferences */}
        {activeTab === 'system' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-[#D8C2B3]/60 space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#534438] flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#006783]" /> App Interface Language
              </label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  className={`py-2.5 rounded-xl font-bold text-xs border ${
                    language === 'en'
                      ? 'bg-[#DC8E47] text-white border-[#DC8E47]'
                      : 'bg-[#F9F9F9] text-[#534438] border-[#D8C2B3]'
                  }`}
                >
                  English (Default)
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange('ta')}
                  className={`py-2.5 rounded-xl font-bold text-xs border ${
                    language === 'ta'
                      ? 'bg-[#DC8E47] text-white border-[#DC8E47]'
                      : 'bg-[#F9F9F9] text-[#534438] border-[#D8C2B3]'
                  }`}
                >
                  தமிழ் (Tamil)
                </button>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
              <p className="text-xs font-bold text-emerald-800">
                Cloud Persistence Active (Firebase Firestore)
              </p>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Your family events, documents (under 2MB), reminders, and users are synced persistently across devices and offline cache.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-[#1A0D0A] hover:bg-black text-white font-bold rounded-xl text-sm shadow-md"
        >
          Done
        </button>
      </div>
    </div>
  );
};
