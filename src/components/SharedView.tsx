import React, { useState, useEffect } from "react";
import { 
  Plus, Calendar, ShoppingCart, Clock, Trash, ListPlus, CheckCircle, Square 
} from "lucide-react";
import { CalendarEvent, Reminder } from "../types";

const API_BASE = "/api";

export default function SharedView() {
  const [subTab, setSubTab] = useState<'calendar' | 'shopping'>('calendar');

  // Data state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);

  // Approved members for dropdown population
  interface ApprovedMember { id: number; name: string; }
  const [approvedMembers, setApprovedMembers] = useState<ApprovedMember[]>([]);

  // Input states for adding new calendar events
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("2026-06-20");
  const [newEventTime, setNewEventTime] = useState("12:00 PM");
  const [newEventMember, setNewEventMember] = useState("Everyone");
  const [newEventCategory, setNewEventCategory] = useState<'family' | 'school' | 'medical' | 'social'>('family');

  // Input states for Shopping checklist
  const [newShopItem, setNewShopItem] = useState("");
  const [newShopMember, setNewShopMember] = useState("Everyone");

  // Filter schedules by family member
  const [memberFilter, setMemberFilter] = useState("All");

  const getToken = () => localStorage.getItem("familyos_token") ?? "";

  const fetchApprovedMembers = async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: { id: number; name: string; approved: boolean }[] = await res.json();
        setApprovedMembers(data.filter(m => m.approved).map(m => ({ id: m.id, name: m.name })));
      }
    } catch { /* silent */ }
  };

  const fetchEvents = async () => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/events`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data: CalendarEvent[] = await res.json();
      setEvents(data);
    }
  };

  const fetchReminders = async () => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/reminders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data: Reminder[] = await res.json();
      setReminders(data);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchApprovedMembers(), fetchEvents(), fetchReminders()]);
      setLoading(false);
    };
    load();
  }, []);

  // Map member name to id; "Everyone" → null
  const memberNameToId = (name: string): number | null => {
    if (name === "Everyone") return null;
    const found = approvedMembers.find(m => m.name === name);
    return found ? found.id : null;
  };

  const handleAddEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    const token = getToken();
    const member_id = memberNameToId(newEventMember);
    const res = await fetch(`${API_BASE}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: newEventTitle,
        date: newEventDate,
        time: newEventTime,
        member_id,
        category: newEventCategory,
      }),
    });
    if (res.ok) {
      setNewEventTitle("");
      await fetchEvents();
    }
  };

  const handleDeleteCalendarEvent = async (id: number) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await fetchEvents();
    }
  };

  const handleAddShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopItem.trim()) return;
    const token = getToken();
    const member_id = memberNameToId(newShopMember);
    const res = await fetch(`${API_BASE}/reminders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: newShopItem,
        time: "Anytime",
        member_id,
        category: "shopping",
      }),
    });
    if (res.ok) {
      setNewShopItem("");
      await fetchReminders();
    }
  };

  const handleDeleteReminder = async (id: number) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/reminders/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await fetchReminders();
    }
  };

  const handleToggleReminder = async (id: number) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    const token = getToken();
    const res = await fetch(`${API_BASE}/reminders/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed: !reminder.completed }),
    });
    if (res.ok) {
      await fetchReminders();
    }
  };

  // Filtered schedule
  const filteredEvents = events.filter(e => 
    memberFilter === "All" || e.member_name === memberFilter || e.member_name === "Everyone"
  );

  const groceryList = reminders.filter(r => r.category === "shopping");

  // Build member dropdown options from approved members + fallback labels
  const memberOptions = [
    { name: "Everyone", id: null },
    ...approvedMembers,
  ];

  return (
    <div className="space-y-6 pt-2 pb-12 px-4 max-w-lg mx-auto" id="sharedView">
      
      {/* Sub-navigation pill switches */}
      <div className="flex bg-slate-100 rounded-xl p-1 shadow-inner">
        <button
          onClick={() => setSubTab('calendar')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-sans font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${subTab === 'calendar' ? 'bg-[#dc8e47] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
        >
          <Calendar className="w-4 h-4" /> Calendar
        </button>
        <button
          onClick={() => setSubTab('shopping')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-sans font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${subTab === 'shopping' ? 'bg-[#dc8e47] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
        >
          <ShoppingCart className="w-4 h-4" /> Shopping
        </button>
      </div>

      {/* --- SUB TAB 1: SHARED FAMILY CALENDAR --- */}
      {subTab === 'calendar' && (
        <div className="space-y-5 animate-fade-in text-left">
          
          {/* Member Filtering controls */}
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Viewing Schedule for:
            </label>
            <div className="flex flex-wrap gap-2">
              {["All", "Everyone", "Mom", "Dad", "Kids"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMemberFilter(m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-sans font-semibold border transition cursor-pointer ${memberFilter === m ? 'bg-[#006783] text-white border-[#006783]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* List of calendar events */}
          <div className="space-y-3">
            {loading && events.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-400 text-xs">
                Loading events...
              </div>
            ) : filteredEvents.map((evt) => (
              <div 
                key={evt.id}
                className="bg-white rounded-xl p-4 border border-orange-100/40 shadow-xs hover:border-orange-200/50 transition-all flex justify-between items-start"
              >
                <div className="flex gap-3">
                  <span className={`w-2.5 h-10 rounded-full flex-shrink-0 ${
                    evt.category === 'medical' ? 'bg-[#ba1a1a]' :
                    evt.category === 'school' ? 'bg-[#006783]' :
                    evt.category === 'social' ? 'bg-[#3fccfd]' : 'bg-[#dc8e47]'
                  }`} />
                  <div>
                    <h4 className="font-sans font-bold text-slate-800 text-sm">{evt.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {evt.date} • {evt.time}
                    </p>
                    <p className="text-[10px] bg-orange-50 text-[#8e4e08] font-bold px-2.5 py-0.5 rounded-full inline-block mt-2">
                      {evt.member_name}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeleteCalendarEvent(evt.id)}
                  className="p-1 rounded-lg text-slate-300 hover:text-[#ba1a1a] transition-all hover:bg-slate-50 cursor-pointer"
                  title="Delete event"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}

            {!loading && filteredEvents.length === 0 && (
              <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-400 text-xs">
                No scheduled meetups are matching this filter.
              </div>
            )}
          </div>

          {/* Add Calendar Event panel */}
          <form onSubmit={handleAddEventSubmit} className="bg-white rounded-2xl p-5 border border-[#d8c2b3]/20 shadow-xs space-y-3">
            <h3 className="font-sans font-bold text-slate-800 text-base mb-1">Schedule Family Event</h3>
            
            <div>
              <input 
                type="text"
                placeholder="Event Title (e.g. Grandma high tea, dental checkup...)"
                required
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-3 py-2 text-xs font-sans outline-none focus:ring-1 focus:ring-[#006783]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date</label>
                <input 
                  type="date"
                  required
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-sans"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Time</label>
                <input 
                  type="text"
                  placeholder="e.g. 3:00 PM"
                  required
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assign To</label>
                <select 
                  value={newEventMember}
                  onChange={(e) => setNewEventMember(e.target.value)}
                  className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-sans outline-none"
                >
                  {memberOptions.map(m => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
                <select 
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value as 'family' | 'school' | 'medical' | 'social')}
                  className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-sans outline-none"
                >
                  <option value="family">Family</option>
                  <option value="school">School</option>
                  <option value="medical">Medical</option>
                  <option value="social">Social</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#006783] hover:bg-[#00546c] text-white py-2.5 rounded-xl text-xs font-bold font-sans transition-all active:scale-98 shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Event
            </button>
          </form>
        </div>
      )}

      {/* --- SUB TAB 2: GROCERY & SHOPPING CHECKLIST --- */}
      {subTab === 'shopping' && (
        <div className="space-y-5 animate-fade-in text-left">
          
          <div className="bg-[#f0f9ff] text-[#006783] border border-blue-100 p-4 rounded-xl flex items-start gap-2.5">
            <ShoppingCart className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-sans font-bold text-xs">Shared Basket Checkout</h4>
              <p className="text-[11px] text-[#004d64] mt-0.5 leading-normal">
                Synchronized household groceries list. Anyone can mark items picked up or add missing kitchen inventories.
              </p>
            </div>
          </div>

          {/* List of items */}
          <div className="space-y-2.5">
            {loading && reminders.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-400 text-xs">
                Loading items...
              </div>
            ) : groceryList.map((shop) => (
              <div 
                key={shop.id}
                className={`bg-white rounded-xl p-3 border border-slate-100 shadow-xs flex items-center justify-between transition-all ${shop.completed ? 'bg-slate-50/60 opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleToggleReminder(shop.id)}
                    className="flex-shrink-0 text-slate-400 hover:text-[#006783] cursor-pointer"
                  >
                    {shop.completed ? (
                      <CheckCircle className="w-5.5 h-5.5 text-[#006783] fill-[#bde9ff]/40" />
                    ) : (
                      <Square className="w-5.5 h-5.5 text-slate-300" />
                    )}
                  </button>
                  <div>
                    <p className={`font-sans font-bold text-sm text-slate-700 ${shop.completed ? 'line-through text-slate-400' : ''}`}>
                      {shop.text}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Requested by {shop.member_name}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteReminder(shop.id)}
                  className="p-1 rounded-md text-slate-300 hover:text-red-500 transition cursor-pointer"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}

            {!loading && groceryList.length === 0 && (
              <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-400 text-xs">
                Shopping list is completely dry! Buy milk or stock cookies.
              </div>
            )}
          </div>

          {/* Add Shopping Item Form */}
          <form onSubmit={handleAddShopSubmit} className="bg-white rounded-2xl p-5 border border-[#d8c2b3]/20 shadow-xs space-y-3">
            <h3 className="font-sans font-bold text-slate-800 text-base mb-1">Add Shopping Item</h3>
            
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Product (e.g. 2 cartons Whole Milk, Bread...)"
                required
                value={newShopItem}
                onChange={(e) => setNewShopItem(e.target.value)}
                className="flex-1 bg-[#fdfaf7] border border-slate-200 rounded-xl px-3 py-2 text-xs font-sans outline-none"
              />
              <select
                value={newShopMember}
                onChange={(e) => setNewShopMember(e.target.value)}
                className="bg-[#fdfaf7] border border-slate-200 rounded-xl px-2 text-xs font-sans outline-none"
              >
                {memberOptions.map(m => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-[#006783] hover:bg-[#00546c] text-white py-2.5 rounded-xl text-xs font-bold font-sans transition-all active:scale-98 shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <ListPlus className="w-4 h-4" /> Put in Grocery Bag
            </button>
          </form>
        </div>
      )}

    </div>
  );
}