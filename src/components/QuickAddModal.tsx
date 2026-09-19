import React, { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { AppointmentCategory, GroceryCategory } from '../types';
import { Calendar, ShoppingCart, Sparkles, Pin } from 'lucide-react';
import { format } from 'date-fns';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'calendar' | 'meals' | 'photos' | 'lists') => void;
}

type QuickType = 'event' | 'grocery' | 'chore' | 'note';

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, onNavigateTab }) => {
  const { members, currentMemberId, addAppointment, addGrocery, addChore, addNote, stores } = useFamily();
  const [selectedType, setSelectedType] = useState<QuickType>('event');

  // Event form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventTime, setEventTime] = useState('16:00');
  const [eventCategory, setEventCategory] = useState<AppointmentCategory>('family');

  // Grocery form
  const [groceryName, setGroceryName] = useState('');
  const [groceryAmount, setGroceryAmount] = useState('');
  const [groceryStore, setGroceryStore] = useState('Rewe');
  const [groceryCat] = useState<GroceryCategory>('produce');

  // Chore form
  const [choreTitle, setChoreTitle] = useState('');
  const [choreMember, setChoreMember] = useState(members[2]?.id || members[0]?.id || 'm1');

  // Note form
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedType === 'event') {
      if (!eventTitle.trim()) return;
      addAppointment({
        title: eventTitle.trim(),
        date: eventDate,
        time: eventTime,
        category: eventCategory,
        memberIds: currentMemberId === 'all' ? [members[0]?.id || 'm1'] : [currentMemberId],
      });
      onNavigateTab('calendar');
    } else if (selectedType === 'grocery') {
      if (!groceryName.trim()) return;
      addGrocery(groceryName.trim(), groceryStore, groceryAmount.trim() || undefined, groceryCat);
      onNavigateTab('lists');
    } else if (selectedType === 'chore') {
      if (!choreTitle.trim()) return;
      addChore(choreTitle.trim(), choreMember, 'daily', 3);
      onNavigateTab('lists');
    } else if (selectedType === 'note') {
      if (!noteTitle.trim() || !noteContent.trim()) return;
      addNote(noteTitle.trim(), noteContent.trim(), 'info', true);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-4 border-b pb-3">
          <h3 className="text-lg font-bold text-stone-900">Quick Add to Household</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-sm font-bold">
            ✕
          </button>
        </div>

        {/* Type Picker Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-stone-100 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => setSelectedType('event')}
            className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              selectedType === 'event' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-stone-600'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Event</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('grocery')}
            className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              selectedType === 'grocery' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-stone-600'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Grocery</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('chore')}
            className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              selectedType === 'chore' ? 'bg-white text-amber-700 shadow-2xs' : 'text-stone-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chore</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('note')}
            className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              selectedType === 'note' ? 'bg-white text-rose-700 shadow-2xs' : 'text-stone-600'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            <span>Notice</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {selectedType === 'event' && (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Dentist visit, Football training"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none"
                  required
                />
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Category</label>
                <select
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value as AppointmentCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none"
                >
                  <option value="family">🎉 Family Outing</option>
                  <option value="sports">⚽ Sports & Clubs</option>
                  <option value="school">🎒 School & Classes</option>
                  <option value="health">🩺 Doctor & Health</option>
                  <option value="work">💼 Work & Errands</option>
                  <option value="social">☕ Friends & Social</option>
                </select>
              </div>
            </>
          )}

          {selectedType === 'grocery' && (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sourdough bread, Almond milk"
                  value={groceryName}
                  onChange={(e) => setGroceryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Amount (e.g. 2 cartons)"
                  value={groceryAmount}
                  onChange={(e) => setGroceryAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none"
                />
                <select
                  value={groceryStore}
                  onChange={(e) => setGroceryStore(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none font-bold"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {selectedType === 'chore' && (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Chore</label>
                <input
                  type="text"
                  placeholder="e.g. Walk Barnaby, Clean bedroom"
                  value={choreTitle}
                  onChange={(e) => setChoreTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Assign To</label>
                <select
                  value={choreMember}
                  onChange={(e) => setChoreMember(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.avatar} {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {selectedType === 'note' && (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. House Alarm Code, Pizza Coupon"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Content</label>
                <textarea
                  rows={2}
                  placeholder="Note details..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 shadow-xs"
            >
              Add Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
