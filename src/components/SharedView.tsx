import React, { useState } from "react";
import { 
  CheckSquare, Square, Trophy, Plus, Calendar, User, 
  Tag, Clock, Trash, ShoppingCart, HelpCircle, CheckCircle, ListPlus 
} from "lucide-react";
import { Chore, CalendarEvent, Reminder } from "../types";

interface SharedViewProps {
  chores: Chore[];
  calendarEvents: CalendarEvent[];
  reminders: Reminder[];
  onToggleChore: (id: string) => void;
  onAddChore: (chore: Omit<Chore, "id">) => void;
  onDeleteChore: (id: string) => void;
  onAddCalendarEvent: (event: Omit<CalendarEvent, "id">) => void;
  onDeleteCalendarEvent: (id: string) => void;
  onAddReminder: (reminder: Omit<Reminder, "id" | "completed">) => void;
  onDeleteReminder: (id: string) => void;
  onToggleReminder: (id: string) => void;
}

export default function SharedView({
  chores,
  calendarEvents,
  reminders,
  onToggleChore,
  onAddChore,
  onDeleteChore,
  onAddCalendarEvent,
  onDeleteCalendarEvent,
  onAddReminder,
  onDeleteReminder,
  onToggleReminder
}: SharedViewProps) {
  // Tabs within Shared View: 'calendar' | 'chores' | 'shopping'
  const [subTab, setSubTab] = useState<'calendar' | 'chores' | 'shopping'>('calendar');

  // Input states for adding new calendar events
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("2026-06-20");
  const [newEventTime, setNewEventTime] = useState("12:00 PM");
  const [newEventMember, setNewEventMember] = useState("Everyone");
  const [newEventCategory, setNewEventCategory] = useState<'family' | 'school' | 'medical' | 'social'>('family');

  // Input states for chores
  const [newChoreTitle, setNewChoreTitle] = useState("");
  const [newChoreAssignee, setNewChoreAssignee] = useState("Dad");
  const [newChorePoints, setNewChorePoints] = useState(10);
  const [newChoreDueDate, setNewChoreDueDate] = useState("2026-06-18");

  // Input states for Shopping checklist
  const [newShopItem, setNewShopItem] = useState("");
  const [newShopMember, setNewShopMember] = useState("Mom");

  // Filter schedules by family member
  const [memberFilter, setMemberFilter] = useState("All");

  const totalPoints = chores.filter(c => c.completed).reduce((sum, c) => sum + c.points, 0);

  const handleAddChoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChoreTitle.trim()) return;
    onAddChore({
      title: newChoreTitle,
      assignee: newChoreAssignee,
      points: Number(newChorePoints),
      completed: false,
      dueDate: newChoreDueDate
    });
    setNewChoreTitle("");
  };

  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    onAddCalendarEvent({
      title: newEventTitle,
      date: newEventDate,
      time: newEventTime,
      member: newEventMember,
      category: newEventCategory
    });
    setNewEventTitle("");
  };

  const handleAddShopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopItem.trim()) return;
    onAddReminder({
      text: newShopItem,
      time: "Anytime",
      member: newShopMember,
      category: "shopping"
    });
    setNewShopItem("");
  };

  // Filtered schedule
  const filteredEvents = calendarEvents.filter(e => 
    memberFilter === "All" || e.member === memberFilter || e.member === "Everyone"
  );

  const groceryList = reminders.filter(r => r.category === "shopping");

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
          onClick={() => setSubTab('chores')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-sans font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${subTab === 'chores' ? 'bg-[#dc8e47] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
        >
          <Trophy className="w-4 h-4" /> Chores
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
            {filteredEvents.map((evt) => (
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
                      {evt.member}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => onDeleteCalendarEvent(evt.id)}
                  className="p-1 rounded-lg text-slate-300 hover:text-[#ba1a1a] transition-all hover:bg-slate-50 cursor-pointer"
                  title="Delete event"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}

            {filteredEvents.length === 0 && (
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
                  <option value="Everyone">Everyone</option>
                  <option value="Mom">Mom</option>
                  <option value="Dad">Dad</option>
                  <option value="Kids">Kids</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
                <select 
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value as any)}
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

      {/* --- SUB TAB 2: CHORE SCOREBOARD --- */}
      {subTab === 'chores' && (
        <div className="space-y-5 animate-fade-in text-left">
          
          {/* Chore Score tracking card */}
          <div className="bg-gradient-to-r from-[#ffdcc2] to-[#bde9ff] rounded-2xl p-4 text-left flex justify-between items-center shadow-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Miller Family Scoreboard</p>
              <h4 className="font-sans font-extrabold text-[#8e4e08] text-2xl mt-0.5">{totalPoints} Points</h4>
              <p className="text-xs text-slate-500 mt-1">Completed duties contribute points towards family rewards!</p>
            </div>
            <Trophy className="w-12 h-12 text-[#dc8e47] opacity-80" />
          </div>

          {/* Chore item components list */}
          <div className="space-y-3">
            {chores.map((chore) => (
              <div 
                key={chore.id}
                className={`bg-white rounded-xl p-4 border border-slate-100 shadow-xs flex items-center justify-between transition-all ${chore.completed ? 'bg-slate-50/70 border-slate-200/50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onToggleChore(chore.id)}
                    className="flex-shrink-0 text-[#006783] hover:opacity-80 transition cursor-pointer"
                  >
                    {chore.completed ? (
                      <CheckCircle className="w-6 h-6 text-[#dc8e47] fill-[#ffdcc2]/50" />
                    ) : (
                      <Square className="w-6 h-6 text-slate-300" />
                    )}
                  </button>
                  <div>
                    <h4 className={`font-sans font-bold text-slate-800 text-sm ${chore.completed ? 'line-through text-slate-400' : ''}`}>
                      {chore.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Due: {chore.dueDate} • Assignee: <strong className="text-slate-600">{chore.assignee}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${chore.completed ? 'bg-slate-100 text-slate-400' : 'bg-orange-50 text-[#8e4e08]'}`}>
                    +{chore.points} pts
                  </span>
                  <button
                    onClick={() => onDeleteChore(chore.id)}
                    className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {chores.length === 0 && (
              <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-400 text-xs">
                No chores registered on scoreboard! Put up dynamic housework tasks.
              </div>
            )}
          </div>

          {/* Add Chore form */}
          <form onSubmit={handleAddChoreSubmit} className="bg-white rounded-2xl p-5 border border-[#d8c2b3]/20 shadow-xs space-y-3">
            <h3 className="font-sans font-bold text-slate-800 text-base mb-1">Add Housework Chore</h3>
            
            <div>
              <input 
                type="text"
                placeholder="e.g. Lawn mowing, watering flowers, clearing dishes..."
                required
                value={newChoreTitle}
                onChange={(e) => setNewChoreTitle(e.target.value)}
                className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-3 py-2 text-xs font-sans outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Score Pts</label>
                <input 
                  type="number"
                  required
                  min="5"
                  max="100"
                  value={newChorePoints}
                  onChange={(e) => setNewChorePoints(Number(e.target.value))}
                  className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-sans outline-none"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Due Date</label>
                <input 
                  type="date"
                  required
                  value={newChoreDueDate}
                  onChange={(e) => setNewChoreDueDate(e.target.value)}
                  className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-sans outline-none"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assign To</label>
                <select 
                  value={newChoreAssignee}
                  onChange={(e) => setNewChoreAssignee(e.target.value)}
                  className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-1.5 py-1.5 text-xs font-sans outline-none"
                >
                  <option value="Dad">Dad</option>
                  <option value="Mom">Mom</option>
                  <option value="Kids">Kids</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#8e4e08] hover:bg-[#dc8e47] text-white py-2.5 rounded-xl text-xs font-bold font-sans transition-all active:scale-98 shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Assign Chore
            </button>
          </form>
        </div>
      )}

      {/* --- SUB TAB 3: GROCERY & SHOPPING CHECKLIST --- */}
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
            {groceryList.map((shop) => (
              <div 
                key={shop.id}
                className={`bg-white rounded-xl p-3 border border-slate-100 shadow-xs flex items-center justify-between transition-all ${shop.completed ? 'bg-slate-50/60 opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onToggleReminder(shop.id)}
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
                      Requested by {shop.member}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteReminder(shop.id)}
                  className="p-1 rounded-md text-slate-300 hover:text-red-500 transition cursor-pointer"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}

            {groceryList.length === 0 && (
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
                <option value="Mom">Mom</option>
                <option value="Dad">Dad</option>
                <option value="Everyone">Everyone</option>
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
