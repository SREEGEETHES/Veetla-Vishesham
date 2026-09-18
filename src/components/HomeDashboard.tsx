import React, { useState } from 'react';
import {
  Mic,
  Calendar,
  Pill,
  ShoppingBag,
  Cake,
  Shield,
  FileText,
  FileCheck,
  Plus,
  ChevronRight,
  Sparkles,
  Clock,
  Gift,
  Heart,
  UploadCloud,
  CheckCircle2,
  Lock,
  PhoneCall
} from 'lucide-react';
import { ReminderItem, Language, User, MilestoneEvent, VaultDocument } from '../types';
import { translations } from '../i18n';
import { soundCtrl } from '../utils/audio';

interface HomeDashboardProps {
  language: Language;
  currentUser: User;
  reminders: ReminderItem[];
  milestones: MilestoneEvent[];
  documents: VaultDocument[];
  onToggleReminder: (id: string) => void;
  onOpenSpeak: () => void;
  onOpenVault: () => void;
  onOpenEvents: () => void;
  onAddReminderModal: () => void;
  onTriggerTestCall: (reminderId?: string, reminderText?: string, assignee?: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  language,
  currentUser,
  reminders,
  milestones,
  documents,
  onToggleReminder,
  onOpenSpeak,
  onOpenVault,
  onOpenEvents,
  onAddReminderModal,
  onTriggerTestCall
}) => {
  const t = translations[language];
  const [showAllReminders, setShowAllReminders] = useState(false);
  const [activeBirthdayCardModal, setActiveBirthdayCardModal] = useState(false);
  const [cardMessage, setCardMessage] = useState('Happy Celebration! Wishing you a blessed and joyous day with the family!');
  const [cardSent, setCardSent] = useState(false);

  // Filter confidential reminders specifically for current user
  const userReminders = reminders.filter((r) => {
    if (currentUser?.role === 'master' && showAllReminders) return true;
    const assigneeLower = (r.assignee || '').toLowerCase().trim();
    const currentNameLower = (currentUser?.name || '').toLowerCase().trim();
    const currentUsernameLower = (currentUser?.username || '').toLowerCase().trim();
    return (
      assigneeLower === currentNameLower ||
      assigneeLower === currentUsernameLower ||
      assigneeLower === 'everyone' ||
      assigneeLower === 'whole family' ||
      !assigneeLower
    );
  });

  const displayedReminders = showAllReminders ? userReminders : userReminders.slice(0, 3);

  // Find nearest celebration milestone
  const upcomingMilestone =
    milestones.find((m) => m.type === 'birthday' || m.type === 'anniversary') || milestones[0];

  const handleSendCelebrationCard = () => {
    setCardSent(true);
    soundCtrl.playCelebrationChime();
    setTimeout(() => {
      setCardSent(false);
      setActiveBirthdayCardModal(false);
    }, 2000);
  };

  return (
    <main className="max-w-lg mx-auto px-4 pt-4 pb-32 space-y-6">
      {/* 1. Welcome Section */}
      <section className="mt-2">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A0D0A] leading-tight tracking-tight">
          {t.goodMorning} <br />
          <span className="text-[#DC8E47]">{currentUser?.name || t.familyName}</span>
        </h2>
        <p className="text-[#534438] text-sm mt-1 font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>{currentUser?.role === 'master' ? 'Master Admin Mode Active' : `Personal Space • @${currentUser?.username}`}</span>
        </p>
      </section>

      {/* 2. Main Kinetic Action: Speak Task */}
      <section className="flex flex-col items-center py-4">
        <div className="relative flex items-center justify-center">
          {/* Animated pulsing outer halo */}
          <div className="absolute w-52 h-52 rounded-full bg-[#DC8E47]/20 animate-ping pointer-events-none" />
          <div className="absolute w-56 h-56 rounded-full border-4 border-[#DC8E47]/30 opacity-70 animate-pulse pointer-events-none" />

          {/* Large kinetic button */}
          <button
            id="speakTaskMainButton"
            onClick={() => {
              soundCtrl.playPreviewTone();
              onOpenSpeak();
            }}
            className="group relative flex flex-col items-center justify-center w-48 h-48 rounded-full bg-[#DC8E47] text-white shadow-xl active:scale-95 hover:brightness-105 transition-all duration-300 z-10 cursor-pointer"
            style={{
              boxShadow: '0 10px 30px rgba(220, 142, 71, 0.35)'
            }}
          >
            <Mic className="w-16 h-16 mb-2 stroke-[2.2] group-hover:scale-110 transition-transform" />
            <span className="font-extrabold text-base uppercase tracking-wider">
              {t.speakTask}
            </span>
          </button>
        </div>

        <p className="mt-4 text-sm text-[#534438] text-center px-4 italic font-medium">
          {t.speakPrompt}
        </p>
      </section>

      {/* 3. Bento Grid: Confidential Reminders & Family Space */}
      <div className="grid grid-cols-1 gap-6">
        {/* Today's Reminders (Scoped to User) */}
        <section className="bg-white rounded-2xl p-5 border border-[#D8C2B3]/60 shadow-xs relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#3AC9FA]" />

          <div className="flex justify-between items-center mb-4 pl-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xl text-[#1A0D0A]">
                {t.todaysReminders}
              </h3>
              <span className="text-xs bg-[#3AC9FA]/20 text-[#006783] font-bold px-2 py-0.5 rounded-full">
                {userReminders.filter((r) => r.status === 'pending').length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onAddReminderModal}
                title="Add New Chore"
                className="p-1.5 text-[#DC8E47] hover:bg-[#DC8E47]/10 rounded-full transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
              <Calendar className="w-5 h-5 text-[#006783]" />
            </div>
          </div>

          {userReminders.length === 0 ? (
            <div className="p-6 text-center space-y-2 border border-dashed border-[#D8C2B3] rounded-xl bg-[#F9F9F9]">
              <Clock className="w-8 h-8 text-[#534438]/50 mx-auto" />
              <p className="text-xs font-bold text-[#1A0D0A]">
                No pending tasks for {currentUser?.name}
              </p>
              <p className="text-[11px] text-[#534438]">
                Tap the microphone button or the "+" icon to schedule a chore or medication alert.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {displayedReminders.map((reminder) => {
                const isDone = reminder.status === 'completed';
                return (
                  <li
                    key={reminder.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isDone
                        ? 'bg-[#F9F9F9] border-black/5 opacity-60 line-through'
                        : 'bg-[#F9F9F9] border-[#D8C2B3]/40 hover:border-[#DC8E47]/40 shadow-2xs'
                    }`}
                  >
                    <div
                      onClick={() => onToggleReminder(reminder.id)}
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full ${
                          reminder.category === 'medication'
                            ? 'bg-[#BDE9FF] text-[#001F2A]'
                            : 'bg-[#FFDCC2] text-[#2E1500]'
                        }`}
                      >
                        {reminder.category === 'medication' ? (
                          <Pill className="w-5 h-5" />
                        ) : (
                          <ShoppingBag className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#1A0D0A]">
                          {reminder.title}
                        </p>
                        <p className="text-xs text-[#534438] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {reminder.time} • For: {reminder.assignee || 'You'} • {isDone ? 'Completed' : 'Pending'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onTriggerTestCall(reminder.id, reminder.title, reminder.assignee)}
                        title="Trigger voice call for this chore"
                        className="px-2 py-1 text-xs font-bold text-[#006783] bg-[#3AC9FA]/15 hover:bg-[#3AC9FA]/30 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Call</span>
                      </button>
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => onToggleReminder(reminder.id)}
                        className="w-5 h-5 rounded border-[#D8C2B3] text-[#DC8E47] focus:ring-[#DC8E47] cursor-pointer"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {userReminders.length > 3 && (
            <button
              onClick={() => setShowAllReminders(!showAllReminders)}
              className="w-full mt-4 py-2.5 rounded-xl border-2 border-[#006783] text-[#006783] font-bold text-sm hover:bg-[#006783]/5 active:scale-98 transition-all cursor-pointer"
            >
              {showAllReminders ? 'Show Less' : t.viewAll}
            </button>
          )}
        </section>

        {/* Family Space Preview (Real Milestones from Master Admin) */}
        <section className="bg-white rounded-2xl p-5 border border-[#D8C2B3]/60 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-xl text-[#1A0D0A]">
              {t.familySpace}
            </h3>
            <button
              onClick={onOpenEvents}
              className="text-[#DC8E47] hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              See All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {upcomingMilestone ? (
            <div className="bg-[#FFDCC2] p-5 rounded-xl flex flex-col items-center text-center relative overflow-hidden shadow-xs border border-[#DC8E47]/20">
              <div className="absolute top-1 right-2 p-2 opacity-15 pointer-events-none">
                {upcomingMilestone.type === 'anniversary' ? (
                  <Heart className="w-24 h-24 text-[#8E4E08]" />
                ) : (
                  <Cake className="w-24 h-24 text-[#8E4E08]" />
                )}
              </div>

              <div className="w-14 h-14 rounded-full bg-white text-[#8E4E08] flex items-center justify-center mb-2 shadow-md border-2 border-[#DC8E47]">
                {upcomingMilestone.type === 'anniversary' ? (
                  <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
                ) : (
                  <Cake className="w-7 h-7 text-[#DC8E47]" />
                )}
              </div>

              <p className="font-bold text-lg text-[#2E1500]">
                {upcomingMilestone.title}
              </p>
              <p className="text-sm font-medium text-[#6D3A00]">
                Honoring {upcomingMilestone.personNames} • {upcomingMilestone.date} ({upcomingMilestone.daysRemaining})
              </p>

              <div className="mt-4 flex gap-3 w-full z-10">
                <button
                  onClick={() => setActiveBirthdayCardModal(true)}
                  className="flex-1 bg-[#8E4E08] text-white py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-xs hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  {t.cardBtn}
                </button>
                <button
                  onClick={onOpenEvents}
                  className="flex-1 bg-white text-[#8E4E08] py-2.5 rounded-full text-xs sm:text-sm font-bold border-2 border-[#8E4E08] hover:bg-[#8E4E08]/5 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Gift className="w-4 h-4" />
                  View Event
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#FFF9F5] p-5 rounded-xl border border-dashed border-[#DC8E47]/40 text-center space-y-2">
              <Cake className="w-8 h-8 text-[#DC8E47] mx-auto" />
              <p className="text-xs font-bold text-[#1A0D0A]">
                No upcoming family birthdays or anniversaries scheduled
              </p>
              <p className="text-[11px] text-[#534438]">
                The Master Admin can schedule persistent birthdays and anniversaries in the Admin Console.
              </p>
              <button
                onClick={onOpenEvents}
                className="mt-2 text-xs font-bold text-[#DC8E47] hover:underline cursor-pointer"
              >
                Open Family Space
              </button>
            </div>
          )}
        </section>

        {/* Shared Vault Preview (Real Documents) */}
        <section className="bg-gradient-to-br from-[#DC8E47]/10 via-[#F9F9F9] to-[#3AC9FA]/10 rounded-2xl p-5 border border-[#D8C2B3]/40 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-xl shadow-xs text-[#DC8E47] border border-black/5">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-[#1A0D0A]">
                  {t.secureVault}
                </h3>
                <p className="text-xs text-[#534438]">
                  {documents.length} Encrypted Family Documents (&lt;2MB)
                </p>
              </div>
            </div>
            <button
              onClick={onOpenVault}
              className="text-xs font-bold text-[#006783] hover:underline cursor-pointer"
            >
              Open Vault
            </button>
          </div>

          {documents.length === 0 ? (
            <div
              onClick={onOpenVault}
              className="bg-white p-5 rounded-2xl border border-dashed border-[#D8C2B3] text-center space-y-2 cursor-pointer hover:border-[#DC8E47] transition-colors"
            >
              <UploadCloud className="w-8 h-8 text-[#DC8E47] mx-auto" />
              <p className="text-xs font-bold text-[#1A0D0A]">
                No documents uploaded yet
              </p>
              <p className="text-[11px] text-[#534438]">
                Store Passports, ID cards, insurance policies & medical records securely.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {documents.slice(0, 3).map((doc) => (
                <button
                  key={doc.id}
                  onClick={onOpenVault}
                  className="bg-white p-3 rounded-xl border border-[#D8C2B3]/30 shadow-xs hover:border-[#3AC9FA] active:scale-95 transition-all text-center flex flex-col items-center justify-center group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-[#3AC9FA]/15 flex items-center justify-center text-[#006783] mb-1.5 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-[#1A0D0A] truncate w-full">
                    {doc.name}
                  </p>
                  <span className="text-[10px] text-[#534438] mt-0.5 capitalize">
                    {doc.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Celebration Card Modal */}
      {activeBirthdayCardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-[#D8C2B3] text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-[#FFDCC2] text-[#8E4E08] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-[#1A0D0A]">
              Send Family Greeting
            </h3>
            <textarea
              value={cardMessage}
              onChange={(e) => setCardMessage(e.target.value)}
              className="w-full p-3 bg-[#F9F9F9] border border-[#D8C2B3] rounded-xl text-xs font-medium text-[#1A0D0A] focus:ring-2 focus:ring-[#DC8E47] focus:outline-none"
              rows={3}
            />

            {cardSent ? (
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Greeting Sent with Chime!
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveBirthdayCardModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#D8C2B3] text-xs font-bold text-[#534438] hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendCelebrationCard}
                  className="flex-1 py-2.5 rounded-xl bg-[#DC8E47] text-white text-xs font-bold hover:brightness-105 shadow-md"
                >
                  Send Greeting
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
