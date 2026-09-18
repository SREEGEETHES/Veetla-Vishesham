import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Image as ImageIcon,
  Calendar,
  Heart,
  Download,
  Upload,
  User as UserIcon,
  CheckCircle2
} from 'lucide-react';
import { MemoryItem, User } from '../types';
import { soundCtrl } from '../utils/audio';

interface MemoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  currentUser: User;
  onAddMemory: (memory: MemoryItem) => void;
}

export const MemoriesModal: React.FC<MemoriesModalProps> = ({
  isOpen,
  onClose,
  memories,
  currentUser,
  onAddMemory
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activePhoto, setActivePhoto] = useState<MemoryItem | null>(null);

  if (!isOpen) return null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size >= 2 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 2MB limit. Please choose a photo under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedPhoto(event.target?.result as string);
      soundCtrl.playPreviewTone();
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhoto) {
      setErrorMsg('Please select a photo for the family memory.');
      return;
    }

    const newMemory: MemoryItem = {
      id: 'mem-' + Date.now(),
      caption: caption.trim() || 'Family moment',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      imageUrl: selectedPhoto,
      uploadedBy: currentUser.name
    };

    onAddMemory(newMemory);
    soundCtrl.playCelebrationChime();
    setCaption('');
    setSelectedPhoto(null);
    setShowAddForm(false);
  };

  const handleDownload = (item: MemoryItem) => {
    const a = document.createElement('a');
    a.href = item.imageUrl;
    a.download = `FamilyOS_Memory_${item.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    soundCtrl.playPreviewTone();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#D8C2B3] max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D8C2B3]/50 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#FFDCC2] text-[#8E4E08] rounded-xl">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#1A0D0A]">
                Family Memories
              </h3>
              <p className="text-[11px] text-[#534438]">
                Cherished milestones, holidays & gatherings
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

        {/* Action button */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold text-[#534438]">
            {memories.length} Moments Saved
          </span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 bg-[#DC8E47] text-white font-bold text-xs rounded-xl shadow-xs hover:brightness-105 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> {showAddForm ? 'Cancel' : 'Add Memory'}
          </button>
        </div>

        {/* Add Memory Form */}
        {showAddForm && (
          <form onSubmit={handleSaveMemory} className="p-4 bg-[#F9F9F9] rounded-2xl border border-[#DC8E47] space-y-3 mb-4">
            <h4 className="font-bold text-xs text-[#8E4E08] uppercase tracking-wider">
              Add New Family Memory (Under 2MB)
            </h4>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-36 bg-white border-2 border-dashed border-[#D8C2B3] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#DC8E47] overflow-hidden transition-all"
            >
              {selectedPhoto ? (
                <img src={selectedPhoto} alt="Selected" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-3 text-[#534438]">
                  <Upload className="w-7 h-7 mx-auto mb-1 text-[#DC8E47]" />
                  <p className="text-xs font-bold">Tap to upload photo</p>
                  <span className="text-[10px] text-[#857467]">Under 2MB (JPG, PNG, WEBP)</span>
                </div>
              )}
            </div>

            {errorMsg && (
              <p className="text-xs text-[#BA1A1A] font-bold">{errorMsg}</p>
            )}

            <div>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption (e.g., Mom & Dad 20th Anniversary Dinner)"
                className="w-full p-2.5 text-xs font-bold rounded-xl border border-[#D8C2B3] bg-white focus:ring-2 focus:ring-[#DC8E47] focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#DC8E47] text-white font-bold text-xs rounded-xl shadow-xs hover:brightness-105"
            >
              Save Memory
            </button>
          </form>
        )}

        {/* Memories Grid */}
        <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
          {memories.map((item) => (
            <div
              key={item.id}
              onClick={() => setActivePhoto(item)}
              className="group relative bg-[#F3F3F3] rounded-2xl overflow-hidden border border-[#D8C2B3]/60 cursor-pointer shadow-2xs hover:shadow-md transition-all flex flex-col"
            >
              <div className="h-28 w-full overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-2.5 bg-white flex-1 flex flex-col justify-between">
                <p className="text-xs font-bold text-[#1A0D0A] line-clamp-1">
                  {item.caption}
                </p>
                <div className="flex items-center justify-between mt-1 text-[10px] text-[#534438]">
                  <span>{item.date}</span>
                  <span className="text-[#8E4E08] font-semibold">{item.uploadedBy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Large Viewer Modal */}
        {activePhoto && (
          <div className="fixed inset-0 z-60 bg-black/85 p-4 flex items-center justify-center">
            <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-[#1A0D0A] truncate">
                  {activePhoto.caption}
                </h4>
                <button
                  onClick={() => setActivePhoto(null)}
                  className="p-1 rounded-full text-[#534438] hover:bg-black/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="w-full max-h-72 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={activePhoto.imageUrl}
                  alt={activePhoto.caption}
                  className="max-w-full max-h-72 object-contain"
                />
              </div>

              <div className="text-xs text-[#534438] flex justify-between items-center pt-1">
                <span>{activePhoto.date}</span>
                <span className="font-semibold text-[#8E4E08]">Uploaded by {activePhoto.uploadedBy}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleDownload(activePhoto)}
                  className="flex-1 py-2.5 bg-[#DC8E47] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4" /> Download Photo
                </button>
                <button
                  onClick={() => setActivePhoto(null)}
                  className="py-2.5 px-4 bg-[#F3F3F3] text-[#1A0D0A] font-bold rounded-xl text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 bg-[#1A0D0A] text-white font-bold rounded-xl text-xs shadow-xs"
        >
          Back to Family Space
        </button>
      </div>
    </div>
  );
};
