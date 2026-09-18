import React, { useState } from 'react';
import {
  PartyPopper,
  Clock,
  Calendar,
  Gift,
  Heart,
  Home,
  Plus,
  Image as ImageIcon,
  Utensils,
  Star,
  CheckCircle2,
  AlertCircle,
  X,
  Cake
} from 'lucide-react';
import { MilestoneEvent, Language, User } from '../types';
import { translations } from '../i18n';
import { soundCtrl } from '../utils/audio';

interface FamilyEventsProps {
  language: Language;
  milestones: MilestoneEvent[];
  currentUser: User;
  onOpenSpeak: () => void;
  onOpenMemories: () => void;
  onAddEvent: (event: MilestoneEvent) => void;
}

export const FamilyEvents: React.FC<FamilyEventsProps> = ({
  language,
  milestones,
  currentUser,
  onOpenSpeak,
  onOpenMemories,
  onAddEvent
}) => {
  const t = translations[language];

  const [toastSent, setToastSent] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventPersons, setNewEventPersons] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventType, setNewEventType] = useState<'birthday' | 'anniversary' | 'visit' | 'rule' | 'home'>('birthday');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventMandatory, setNewEventMandatory] = useState(true);

  // Find featured celebration milestone (e.g. Anniversary or nearest birthday)
  const featuredEvent = milestones.find((m) => m.type === 'anniversary') || milestones[0];

  const handleSendSharedToast = () => {
    setToastSent(true);
    soundCtrl.playCelebrationChime();
    setTimeout(() => setToastSent(false), 3500);
  };

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) return;

    const eventDateObj = new Date(newEventDate);
    const now = new Date();
    const diffTime = eventDateObj.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysRemaining = diffDays <= 0 ? 'Today' : `${diffDays} days to go`;

    const created: MilestoneEvent = {
      id: 'mile-' + Date.now(),
      title: newEventTitle.trim(),
      personNames: newEventPersons.trim() || currentUser.name,
      date: eventDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      daysRemaining,
      type: newEventType,
      description: newEventDesc.trim() || 'Mandatory family celebration',
      isMandatory: newEventMandatory,
      actionLabel: newEventType === 'birthday' ? 'Gift Ideas' : 'Plan Feast'
    };

    onAddEvent(created);
    soundCtrl.playCelebrationChime();
    setNewEventTitle('');
    setNewEventPersons('');
    setNewEventDate('');
    setNewEventDesc('');
    setShowAddEventModal(false);
  };

  return (
    <main className="max-w-lg mx-auto px-4 pt-4 pb-32 space-y-6">
      {/* 1. Featured Celebration Banner with Names instead of Relationship */}
      {featuredEvent ? (
        <section className="relative overflow-hidden rounded-3xl bg-[#DC8E47] p-6 text-white shadow-lg border border-[#DC8E47]">
          <div className="absolute top-1 right-2 p-2 opacity-20 pointer-events-none">
            <PartyPopper className="w-28 h-28 text-white" />
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-white/25 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                SPECIAL OCCASION • {featuredEvent.daysRemaining}
              </span>
              <span className="text-xs font-bold text-white/90">
                {featuredEvent.date}
              </span>
            </div>

            {/* Banner using Specific Person Names */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                {featuredEvent.title}
              </h2>
              <p className="text-sm font-medium text-white/90 mt-1">
                {featuredEvent.description || `Honoring ${featuredEvent.personNames} with blessings and love`}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-white/90">
              <span>Celebrants:</span>
              <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-white">{featuredEvent.personNames}</span>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                onClick={handleSendSharedToast}
                className="bg-[#1A0D0A] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:bg-black active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                {toastSent ? 'Toast Dispatched! 🥂' : t.sendToast}
              </button>
              <button
                onClick={onOpenMemories}
                className="bg-white/25 backdrop-blur-md border border-white/40 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-white/35 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" /> {t.viewMemories}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* 2. Chronological Timeline Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h3 className="font-extrabold text-xl text-[#1A0D0A]">
            {t.upcomingMilestones}
          </h3>
          <p className="text-xs text-[#534438] mt-0.5">
            All family birthdays, anniversaries & scheduled gatherings
          </p>
        </div>

        {/* Master Admin / Member Add Event */}
        <button
          onClick={() => setShowAddEventModal(true)}
          className="px-3 py-1.5 bg-[#8E4E08] hover:bg-[#DC8E47] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Event
        </button>
      </div>

      {/* 3. All Events Listed Down */}
      {milestones.length === 0 ? (
        <div className="bg-white border border-dashed border-[#D8C2B3] p-8 rounded-3xl text-center space-y-2">
          <Cake className="w-12 h-12 text-[#DC8E47] mx-auto opacity-70" />
          <h4 className="font-bold text-base text-[#1A0D0A]">No Family Events Scheduled Yet</h4>
          <p className="text-xs text-[#534438] max-w-xs mx-auto">
            Birthdays and anniversaries assigned by the Master Admin or family members will be permanently listed here.
          </p>
          <button
            onClick={() => setShowAddEventModal(true)}
            className="mt-2 px-4 py-2 bg-[#DC8E47] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
          >
            Add First Family Event
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {milestones.map((event) => (
            <div
              key={event.id}
              className={`bg-white border rounded-2xl p-4.5 shadow-2xs transition-all relative overflow-hidden ${
                event.isMandatory
                  ? 'border-[#DC8E47]/70 hover:border-[#DC8E47]'
                  : 'border-[#D8C2B3]/60 hover:border-[#3AC9FA]'
              }`}
            >
              {event.isMandatory && (
                <div className="absolute top-0 right-0 bg-[#DC8E47] text-white text-[9px] font-black px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
                  <Star className="w-3 h-3 fill-white" /> Mandatory
                </div>
              )}

              <div className="flex items-start gap-3.5">
                {/* Event Icon/Avatar */}
                <div className="w-12 h-12 rounded-2xl bg-[#FFDCC2]/60 flex items-center justify-center text-[#8E4E08] flex-shrink-0">
                  {event.type === 'birthday' ? (
                    <span className="text-2xl">🎂</span>
                  ) : event.type === 'anniversary' ? (
                    <Heart className="w-6 h-6 text-[#DC8E47] fill-[#DC8E47]/20" />
                  ) : event.type === 'visit' ? (
                    <Utensils className="w-6 h-6 text-[#006783]" />
                  ) : (
                    <Calendar className="w-6 h-6 text-[#006783]" />
                  )}
                </div>

                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#DC8E47]">
                      {event.date} • {event.daysRemaining}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-base text-[#1A0D0A] mt-0.5">
                    {event.title}
                  </h4>

                  {event.personNames && (
                    <p className="text-xs font-bold text-[#8E4E08] mt-0.5">
                      For: {event.personNames}
                    </p>
                  )}

                  <p className="text-xs text-[#534438] mt-1 leading-relaxed">
                    {event.description}
                  </p>

                  {/* Event Action Button */}
                  <div className="pt-3 mt-3 border-t border-[#D8C2B3]/40 flex items-center justify-between">
                    <span className="text-[11px] text-[#857467] font-medium">
                      Celebrant: {event.personNames || 'Whole Family'}
                    </span>

                    {event.type === 'birthday' ? (
                      <button
                        onClick={() => setShowGiftModal(true)}
                        className="px-3 py-1 bg-[#FFDCC2] text-[#8E4E08] font-bold text-xs rounded-xl hover:bg-[#DC8E47] hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Gift className="w-3.5 h-3.5" /> Gift Ideas
                      </button>
                    ) : event.type === 'visit' ? (
                      <button
                        onClick={() => setShowMenuModal(true)}
                        className="px-3 py-1 bg-[#BDE9FF] text-[#006783] font-bold text-xs rounded-xl hover:bg-[#006783] hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Utensils className="w-3.5 h-3.5" /> Plan Menu
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          soundCtrl.playCelebrationChime();
                          handleSendSharedToast();
                        }}
                        className="px-3 py-1 border border-[#006783] text-[#006783] font-bold text-xs rounded-xl hover:bg-[#006783]/5 transition-all cursor-pointer"
                      >
                        Celebrate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Memories Shortcut Banner */}
      <div
        onClick={onOpenMemories}
        className="w-full p-4.5 rounded-2xl bg-gradient-to-r from-[#FFDCC2]/60 to-[#BDE9FF]/60 flex items-center justify-between cursor-pointer hover:shadow-sm border border-[#D8C2B3]/40 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white rounded-xl text-[#8E4E08] shadow-2xs group-hover:scale-105 transition-transform">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#1A0D0A]">View Family Memories</h4>
            <p className="text-xs text-[#534438]">Cherished photo albums and milestone records</p>
          </div>
        </div>
        <span className="text-xs font-bold text-[#8E4E08] group-hover:underline">
          Open Gallery →
        </span>
      </div>

      {/* Add Mandatory / Regular Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleCreateEventSubmit}
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[#D8C2B3] space-y-3.5"
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#D8C2B3]/50">
              <h4 className="font-extrabold text-base text-[#1A0D0A]">
                Add Family Event
              </h4>
              <button
                type="button"
                onClick={() => setShowAddEventModal(false)}
                className="p-1 rounded-full text-[#534438] hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-[#534438] block mb-1">
                Event Title
              </label>
              <input
                type="text"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="e.g. Leo's 12th Birthday, Paati's 75th Birthday"
                className="w-full p-2.5 text-xs font-bold rounded-xl border border-[#D8C2B3] focus:ring-2 focus:ring-[#DC8E47] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#534438] block mb-1">
                Person Names (e.g. Priya & Alexander, Leo)
              </label>
              <input
                type="text"
                value={newEventPersons}
                onChange={(e) => setNewEventPersons(e.target.value)}
                placeholder="Enter person names (not relationship)"
                className="w-full p-2.5 text-xs font-bold rounded-xl border border-[#D8C2B3] focus:ring-2 focus:ring-[#DC8E47] focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#534438] block mb-1">
                  Event Date
                </label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full p-2 text-xs font-bold rounded-xl border border-[#D8C2B3]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#534438] block mb-1">
                  Type
                </label>
                <select
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value as any)}
                  className="w-full p-2 text-xs font-bold rounded-xl border border-[#D8C2B3]"
                >
                  <option value="birthday">Birthday</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="visit">Family Visit</option>
                  <option value="home">Home Milestone</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#534438] block mb-1">
                Description / Notes
              </label>
              <textarea
                value={newEventDesc}
                onChange={(e) => setNewEventDesc(e.target.value)}
                rows={2}
                placeholder="Notes for gifts, menu, or gathering plans..."
                className="w-full p-2 text-xs font-bold rounded-xl border border-[#D8C2B3]"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-[#1A0D0A] cursor-pointer">
              <input
                type="checkbox"
                checked={newEventMandatory}
                onChange={(e) => setNewEventMandatory(e.target.checked)}
                className="w-4 h-4 rounded text-[#DC8E47] focus:ring-[#DC8E47]"
              />
              <span>Set as Mandatory Event (Highlighted)</span>
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddEventModal(false)}
                className="flex-1 py-2.5 border border-[#D8C2B3] text-xs font-bold rounded-xl text-[#534438]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#DC8E47] text-white text-xs font-bold rounded-xl shadow-xs hover:brightness-105"
              >
                Save Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gift Wishlist Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[#D8C2B3]">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-base font-extrabold text-[#8E4E08] flex items-center gap-2">
                <Gift className="w-5 h-5" /> Birthday Wishlist
              </h4>
              <button onClick={() => setShowGiftModal(false)} className="p-1 text-[#534438]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-xs mb-4">
              <div className="p-3 bg-[#F9F9F9] rounded-xl border border-[#D8C2B3]/50 flex justify-between items-center">
                <span className="font-bold text-[#1A0D0A]">LEGO Technic Bugatti</span>
                <span className="text-[#DC8E47] font-bold">Reserved by Alexander</span>
              </div>
              <div className="p-3 bg-[#F9F9F9] rounded-xl border border-[#D8C2B3]/50 flex justify-between items-center">
                <span className="font-bold text-[#1A0D0A]">Cricket Bat (English Willow)</span>
                <span className="text-emerald-700 font-bold">Reserved by Priya</span>
              </div>
            </div>
            <button
              onClick={() => setShowGiftModal(false)}
              className="w-full py-2.5 bg-[#1A0D0A] text-white font-bold rounded-xl text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Menu Planner Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[#D8C2B3]">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-base font-extrabold text-[#006783] flex items-center gap-2">
                <Utensils className="w-5 h-5" /> Grandma's Welcome Feast Menu
              </h4>
              <button onClick={() => setShowMenuModal(false)} className="p-1 text-[#534438]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#534438] mb-3">
              Traditional recipes coordinated for the family gathering:
            </p>

            <div className="space-y-2 text-xs mb-4">
              <div className="p-2.5 bg-[#F9F9F9] rounded-xl border border-[#D8C2B3]/50 flex justify-between font-bold">
                <span>Medu Vada & Fresh Coconut Chutney</span>
                <span className="text-[#8E4E08]">Priya</span>
              </div>
              <div className="p-2.5 bg-[#F9F9F9] rounded-xl border border-[#D8C2B3]/50 flex justify-between font-bold">
                <span>Traditional Drumstick Sambar & Poriyal</span>
                <span className="text-[#8E4E08]">Alexander</span>
              </div>
              <div className="p-2.5 bg-[#F9F9F9] rounded-xl border border-[#D8C2B3]/50 flex justify-between font-bold">
                <span>Filter Kaapi & Mysore Pak</span>
                <span className="text-[#8E4E08]">Leo</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowMenuModal(false);
                soundCtrl.playPreviewTone();
              }}
              className="w-full py-2.5 bg-[#006783] text-white font-bold rounded-xl text-xs"
            >
              Save Menu Plan
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
