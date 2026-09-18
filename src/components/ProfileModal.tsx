import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  User as UserIcon,
  Shield,
  CheckCircle2,
  Phone,
  KeyRound,
  LogOut,
  Image as ImageIcon,
  Send,
  HelpCircle,
  PhoneCall,
  Loader2,
  Sparkles
} from 'lucide-react';
import { User, Language } from '../types';
import { soundCtrl } from '../utils/audio';
import { dispatchTelegramCall } from '../utils/callService';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateProfile: (updated: Partial<User>) => void;
  onOpenLoginModal: () => void;
  language: Language;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', // Dad
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', // Mom
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', // Son Leo
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', // Daughter
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80', // Grandfather
  'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=150&auto=format&fit=crop&q=80'  // Grandmother
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  onOpenLoginModal,
  language
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(currentUser.name);
  const [relationship, setRelationship] = useState(currentUser.relationship);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [telegramUsername, setTelegramUsername] = useState(currentUser.telegramUsername || '');
  const [callMeBotApiKey, setCallMeBotApiKey] = useState(currentUser.callMeBotApiKey || '');
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);
  const [isTestingCall, setIsTestingCall] = useState(false);
  const [testCallStatus, setTestCallStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Profile Photo Upload (< 2MB limit constraint)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size >= 2 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 2MB limit. Please upload an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setAvatar(result);
      onUpdateProfile({ avatar: result });
      soundCtrl.playPreviewTone();
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTestMyTelegram = async () => {
    const handleToTest = telegramUsername.trim() || phone.trim();
    if (!handleToTest) {
      setErrorMsg('Please enter your Telegram @username or phone number first.');
      return;
    }

    setIsTestingCall(true);
    setTestCallStatus('Sending call signal to Telegram...');
    soundCtrl.playPreviewTone();

    const res = await dispatchTelegramCall({
      targetUserHandle: handleToTest,
      recipientName: name || currentUser.name,
      choreTitle: 'Personal Call Test & Audio Verification',
      language,
      apiKey: callMeBotApiKey.trim() || undefined
    });

    setIsTestingCall(false);
    if (res.success) {
      setTestCallStatus(`Calling ${res.target}! Check your Telegram phone app.`);
      soundCtrl.playCelebrationChime();
    } else {
      setTestCallStatus(`Notice: ${res.message}`);
    }

    setTimeout(() => {
      setTestCallStatus(null);
    }, 6000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim(),
      relationship: relationship.trim(),
      phone: phone.trim(),
      telegramUsername: telegramUsername.trim(),
      callMeBotApiKey: callMeBotApiKey.trim(),
      avatar
    });
    setSavedSuccess(true);
    soundCtrl.playCelebrationChime();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[#D8C2B3] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#D8C2B3]/50 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#DC8E47]/20 text-[#8E4E08] rounded-xl">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#1A0D0A]">
                My Profile
              </h3>
              <p className="text-[11px] text-[#534438]">
                {currentUser.role === 'master' ? 'Master Administrator' : 'Family Member'}
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

        {/* Avatar Section & Photo Change */}
        <div className="flex flex-col items-center mb-5">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#DC8E47] shadow-md">
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Change Photo (<2MB)"
              className="absolute bottom-0 right-0 p-2 bg-[#8E4E08] hover:bg-[#DC8E47] text-white rounded-full shadow-md active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          <p className="text-[11px] text-[#534438] mt-2 font-medium">
            Tap camera or select preset below (Max 2MB)
          </p>

          {/* Preset Avatars */}
          <div className="flex items-center gap-2 mt-2">
            {PRESET_AVATARS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setAvatar(preset);
                  onUpdateProfile({ avatar: preset });
                  soundCtrl.playPreviewTone();
                }}
                className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${
                  avatar === preset
                    ? 'border-[#8E4E08] ring-2 ring-[#DC8E47]/40 scale-110'
                    : 'border-[#D8C2B3] opacity-75 hover:opacity-100'
                }`}
              >
                <img src={preset} alt="preset" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {errorMsg && (
            <p className="text-xs text-[#BA1A1A] font-bold mt-2 text-center">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-[#534438] block mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 text-sm rounded-xl border border-[#D8C2B3] focus:ring-2 focus:ring-[#DC8E47] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#534438] block mb-1">
              Family Relationship
            </label>
            <input
              type="text"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="e.g. Father, Mother, Son, Grandmother"
              className="w-full p-2.5 text-sm rounded-xl border border-[#D8C2B3] focus:ring-2 focus:ring-[#DC8E47] focus:outline-none"
              required
            />
          </div>

          {/* Personal Telegram Settings & CallMeBot API Key */}
          <div className="p-3.5 bg-sky-50/60 border border-sky-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#229ED9] text-white flex items-center justify-center shadow-xs">
                  <Send className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Personal Telegram Voice Calls</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Chore reminders will ring this phone</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTelegramGuide(!showTelegramGuide)}
                className="text-[11px] text-[#006783] hover:text-[#004e63] font-bold flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showTelegramGuide ? 'Hide Guide' : 'How it works'}
              </button>
            </div>

            {/* Quick Setup Guide Drawer */}
            {showTelegramGuide && (
              <div className="p-3 bg-white rounded-xl border border-sky-200/80 text-[11px] text-slate-700 space-y-1.5 animate-in fade-in duration-150">
                <p className="font-extrabold text-[#006783]">3-Step Setup for Personal Phone Ring:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Open Telegram on your phone.</li>
                  <li>Search for <strong className="text-[#229ED9]">@CallMeBot_call</strong> (or <strong className="text-[#229ED9]">@CallMeBot_txtbot</strong>) and tap <strong>Start</strong> (<code className="bg-slate-100 px-1 rounded">/start</code>). This authorizes the bot to call you!</li>
                  <li>Enter your Telegram <strong>@username</strong> below. If the bot replies with an API Key, paste it in the API Key box (optional).</li>
                </ol>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Your Telegram Username or Phone:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder="@your_username or +919840123456"
                  className="w-full pl-3 pr-2 py-2 text-xs rounded-xl bg-white border border-sky-300 focus:ring-2 focus:ring-[#229ED9] focus:outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Personal CallMeBot API Key <span className="text-slate-400 font-normal">(Optional)</span>:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={callMeBotApiKey}
                  onChange={(e) => setCallMeBotApiKey(e.target.value)}
                  placeholder="e.g. 748291 (leave blank if using username only)"
                  className="w-full pl-3 pr-2 py-2 text-xs rounded-xl bg-white border border-sky-300 focus:ring-2 focus:ring-[#229ED9] focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Test Call Trigger Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestMyTelegram}
                disabled={isTestingCall || (!telegramUsername && !phone)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  !telegramUsername && !phone
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#229ED9] hover:bg-[#1a8bc2] text-white shadow-xs active:scale-98'
                }`}
              >
                {isTestingCall ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting Call to Telegram...</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Test Ring My Telegram Now</span>
                  </>
                )}
              </button>

              {testCallStatus && (
                <p className="text-[11px] font-bold text-sky-800 mt-2 text-center bg-sky-100/70 p-2 rounded-lg border border-sky-300/50">
                  {testCallStatus}
                </p>
              )}
            </div>
          </div>

          <div className="p-3 bg-[#F9F9F9] rounded-xl border border-[#D8C2B3]/50 text-xs text-[#534438] space-y-1">
            <div className="flex justify-between">
              <span>Login ID:</span>
              <span className="font-bold text-[#1A0D0A]">@{currentUser.username}</span>
            </div>
            <div className="flex justify-between">
              <span>Account Role:</span>
              <span className="font-bold uppercase text-[#8E4E08]">{currentUser.role}</span>
            </div>
            <div className="flex justify-between">
              <span>Telegram Voice Status:</span>
              <span className={`font-bold ${telegramUsername ? 'text-emerald-700' : 'text-amber-700'}`}>
                {telegramUsername ? '● Connected' : '○ Not Linked'}
              </span>
            </div>
          </div>

          {savedSuccess && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLoginModal();
              }}
              className="flex-1 py-2.5 bg-[#F3F3F3] text-[#534438] hover:text-[#1A0D0A] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Switch User
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#DC8E47] hover:brightness-105 text-white font-bold rounded-xl text-xs shadow-xs"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
