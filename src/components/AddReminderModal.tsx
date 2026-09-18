import React, { useState, useEffect } from 'react';
import { X, Clock, Plus, PhoneCall, Bell, User as UserIcon } from 'lucide-react';
import { ReminderItem, Language, User } from '../types';
import { soundCtrl } from '../utils/audio';

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (reminder: ReminderItem) => void;
  language: Language;
  currentUser: User | null;
  users: User[];
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  language,
  currentUser,
  users
}) => {
  const myName = currentUser?.name || 'Myself';

  const [title, setTitle] = useState('');
  const [time, setTime] = useState('17:30');
  const [category, setCategory] = useState<'medication' | 'shopping' | 'chore' | 'general'>('chore');
  const [assignee, setAssignee] = useState(myName);
  const [method, setMethod] = useState<'call' | 'notification'>('call');

  // Reset default assignee when modal opens or user changes
  useEffect(() => {
    if (isOpen) {
      setAssignee(myName);
    }
  }, [isOpen, myName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Format display time
    const [hStr, mStr] = time.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const formattedTime = `${h}:${m} ${ampm}`;

    const newReminder: ReminderItem = {
      id: 'rem-' + Date.now(),
      title: title.trim(),
      time: formattedTime,
      assignee,
      status: 'pending',
      category,
      method,
      isCalled: false
    };

    onAdd(newReminder);
    soundCtrl.playCelebrationChime();
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[#D8C2B3] space-y-4"
      >
        <div className="flex justify-between items-center pb-2 border-b border-[#D8C2B3]/50">
          <h4 className="font-extrabold text-lg text-[#1A0D0A]">
            {language === 'ta' ? 'நினைவூட்டல் சேர்க்க' : 'Add Reminder'}
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#534438] hover:bg-black/5 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="text-xs font-bold text-[#534438] block mb-1">
            {language === 'ta' ? 'நினைவூட்டல் தலைப்பு' : 'Reminder Title'}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={language === 'ta' ? 'உதா. மாலை 5 மணி மாத்திரை, பால் வாங்க' : 'e.g. Water plants, Evening BP Tablet'}
            className="w-full p-2.5 text-sm rounded-xl border border-[#D8C2B3] focus:ring-2 focus:ring-[#DC8E47] focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#534438] block mb-1">
              {language === 'ta' ? 'நேரம்' : 'Time'}
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full p-2 text-sm rounded-xl border border-[#D8C2B3] focus:ring-2 focus:ring-[#DC8E47]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#534438] block mb-1">
              {language === 'ta' ? 'வகை' : 'Category'}
            </label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as 'medication' | 'shopping' | 'chore' | 'general')
              }
              className="w-full p-2 text-sm rounded-xl border border-[#D8C2B3] focus:ring-2 focus:ring-[#DC8E47]"
            >
              <option value="chore">{language === 'ta' ? 'வேலை (Chore)' : 'Chore'}</option>
              <option value="medication">{language === 'ta' ? 'மருந்து (Medication)' : 'Medication'}</option>
              <option value="shopping">{language === 'ta' ? 'ஷாப்பிங் (Shopping)' : 'Shopping'}</option>
              <option value="general">{language === 'ta' ? 'பொதுவானது (General)' : 'General'}</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-[#534438]">
              {language === 'ta' ? 'யாருக்கு ஒதுக்க வேண்டும் (Assignee)' : 'Assignee'}
            </label>
            <span className="text-[10px] text-[#8E4E08] font-bold">
              {language === 'ta' ? 'முதல் முன்னுரிமை: நான்' : 'Preference: Myself'}
            </span>
          </div>
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="w-full p-2 text-sm rounded-xl border border-[#D8C2B3] focus:ring-2 focus:ring-[#DC8E47] bg-white font-medium"
          >
            {/* First preference: Myself */}
            <option value={myName}>⭐ {language === 'ta' ? `எனக்கு (${myName})` : `Myself (${myName})`}</option>
            {users
              .filter((u) => u.name.toLowerCase() !== myName.toLowerCase())
              .map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name} ({u.relationship})
                </option>
              ))}
            <option value="Everyone">
              {language === 'ta' ? 'அனைவருக்கும் (Everyone)' : 'Everyone (Household)'}
            </option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-[#534438] block mb-1">
            {language === 'ta' ? 'அறிவிப்பு முறை' : 'Reminder Notification Channel'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'call' as const, label: 'Telegram Voice Call', icon: PhoneCall },
              { id: 'notification' as const, label: 'Push Notification', icon: Bell }
            ].map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    method === m.id
                      ? 'bg-[#006783] text-white border-[#006783] shadow-xs'
                      : 'bg-white text-[#534438] border-[#D8C2B3] hover:border-[#006783]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-[#8E4E08] hover:bg-[#DC8E47] text-white font-black rounded-xl text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{language === 'ta' ? 'நினைவூட்டலை சேமி' : 'Save Reminder'}</span>
        </button>
      </form>
    </div>
  );
};
