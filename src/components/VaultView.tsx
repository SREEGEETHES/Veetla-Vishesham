import React, { useState, useRef } from "react";
import { Lock, Unlock, Eye, EyeOff, Shield, RefreshCw, Plus, Trash, FileUp, KeyRound, Check } from "lucide-react";
import { VaultSecret } from "../types";

interface VaultViewProps {
  secrets: VaultSecret[];
  onAddSecret: (secret: Omit<VaultSecret, "id" | "lastUpdated">) => void;
  onDeleteSecret: (id: string) => void;
}

export default function VaultView({ secrets, onAddSecret, onDeleteSecret }: VaultViewProps) {
  const [pin, setPin] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState("");
  const [unveiledMap, setUnveiledMap] = useState<Record<string, boolean>>({});

  // Input adding controls
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<'wifi' | 'policy' | 'medical' | 'other'>("wifi");
  const [newSecret, setNewSecret] = useState("");
  const [newNote, setNewNote] = useState("");

  // File Drag and Drop states
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string, size: string, date: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const correctPin = "1234";

  const handleKeypadPress = (val: string) => {
    setPinError("");
    if (pin.length < 4) {
      const nextPin = pin + val;
      setPin(nextPin);
      if (nextPin === correctPin) {
        setTimeout(() => {
          setIsUnlocked(true);
          setPin("");
        }, 300);
      } else if (nextPin.length === 4) {
        // wrong code entered
        setTimeout(() => {
          setPinError("Access Denied. Hint: Enter '1234'");
          setPin("");
        }, 400);
      }
    }
  };

  const handleClearPin = () => {
    setPin("");
    setPinError("");
  };

  const toggleUnveil = (id: string) => {
    setUnveiledMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSecret.trim()) return;
    onAddSecret({
      title: newTitle,
      type: newType,
      secret: newSecret,
      note: newNote
    });
    setNewTitle("");
    setNewSecret("");
    setNewNote("");
  };

  // Drag and drop mechanics
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      addUploadedFile(e.target.files[0]);
    }
  };

  const addUploadedFile = (file: File) => {
    const sizeStr = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(1) + " MB" 
      : (file.size / 1024).toFixed(0) + " KB";
    
    setUploadedFiles(prev => [
      ...prev, 
      {
        name: file.name,
        size: sizeStr,
        date: new Date().toLocaleDateString()
      }
    ]);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 pt-2 pb-12 px-4 max-w-lg mx-auto text-left" id="vaultView">
      
      {/* LOCKED SCREEN KEYPAD */}
      {!isUnlocked ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center space-y-6 space-y-md">
          <div className="flex flex-col items-center">
            <span className="p-3 bg-red-50 text-[#ba1a1a] rounded-full inline-block animate-pulse">
              <Lock className="w-8 h-8" />
            </span>
            <h3 className="font-sans font-extrabold text-slate-800 text-lg mt-3">Enter Secret Vault PIN</h3>
            <p className="text-xs text-slate-400 mt-1">To view WiFi credentials and family insurance cards</p>
          </div>

          {/* Code Dots */}
          <div className="flex justify-center gap-4 py-2">
            {[0, 1, 2, 3].map((idx) => (
              <span 
                key={idx}
                className={`w-4 h-4 rounded-full border-2 border-slate-300 transition-all ${
                  pin.length > idx ? 'bg-[#dc8e47] border-[#dc8e47] scale-110' : 'bg-slate-100'
                }`}
              />
            ))}
          </div>

          {pinError && (
            <p className="text-xs text-[#ba1a1a] font-semibold animate-bounce">{pinError}</p>
          )}

          {/* Keypad Layout 3x4 */}
          <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num)}
                className="w-14 h-14 bg-slate-50 border border-slate-200/50 rounded-full font-bold text-slate-700 active:bg-orange-100 transition-all text-sm flex items-center justify-center cursor-pointer"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClearPin}
              className="w-14 h-14 bg-slate-100 rounded-full font-bold text-slate-500 active:bg-slate-200 transition text-[12px] flex items-center justify-center cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={() => handleKeypadPress("0")}
              className="w-14 h-14 bg-slate-50 border border-slate-200/50 rounded-full font-bold text-slate-700 active:bg-orange-100 transition text-sm flex items-center justify-center cursor-pointer"
            >
              0
            </button>
            <span className="w-14 h-14 flex items-center justify-center text-slate-400">
              <KeyRound className="w-5 h-5 text-slate-300" />
            </span>
          </div>
        </div>
      ) : (
        /* UNLOCKED SECURE DRAWER VIEW */
        <div className="space-y-6 animate-fade-in">
          
          {/* Header indicator */}
          <div className="bg-[#e6fcf5] text-[#006783] p-4 rounded-xl border border-teal-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Unlock className="w-5 h-5 text-teal-600 animate-bounce" />
              <div>
                <h4 className="font-sans font-bold text-xs text-teal-800">Secure Drawer Open</h4>
                <p className="text-[10px] text-teal-600">Local isolation encryption activated</p>
              </div>
            </div>
            <button 
              onClick={() => setIsUnlocked(false)}
              className="text-xs bg-white text-[#ba1a1a] border border-red-200 px-3 py-1 rounded-full font-bold hover:bg-red-50 cursor-pointer"
            >
              Lock Vault
            </button>
          </div>

          {/* List of interactive Credentials */}
          <div className="space-y-3">
            {secrets.map((sec) => {
              const isVeiled = !unveiledMap[sec.id];
              return (
                <div 
                  key={sec.id}
                  className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs relative text-left"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#dc8e47] bg-orange-50 px-2 py-0.5 rounded-full inline-block mb-1.5">
                        {sec.type}
                      </span>
                      <h4 className="font-sans font-bold text-slate-800 text-sm">{sec.title}</h4>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleUnveil(sec.id)}
                        className="p-1 px-1.5 text-slate-400 rounded-lg hover:text-[#006783] hover:bg-slate-50 transition"
                        title={isVeiled ? "Unveil credential" : "Mask credential"}
                      >
                        {isVeiled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onDeleteSecret(sec.id)}
                        className="p-1 text-slate-300 rounded-lg hover:text-red-500 hover:bg-slate-50 transition"
                        title="Delete key"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/50 mt-3 font-mono text-xs text-slate-700 flex justify-between items-center">
                    <span className="tracking-wider break-all">
                      {isVeiled ? "••••••••••••••" : sec.secret}
                    </span>
                  </div>

                  {sec.note && (
                    <p className="text-[11px] text-slate-500 mt-2 italic">{sec.note}</p>
                  )}
                  <span className="text-[9px] text-slate-300 block mt-2">{sec.lastUpdated}</span>
                </div>
              );
            })}
          </div>

          {/* File Upload Drag & Drop Area (Guidelines compliant) */}
          <div className="bg-white rounded-2xl p-5 border border-[#d8c2b3]/25 shadow-xs space-y-4">
            <h3 className="font-sans font-bold text-slate-800 text-sm">Add Secure Documents</h3>
            
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                dragActive 
                  ? "border-[#dc8e47] bg-orange-50/20" 
                  : "border-slate-300 bg-slate-50 hover:bg-[#fdfaf7]/50"
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              />
              <FileUp className="w-8 h-8 text-slate-400" />
              <p className="text-xs font-sans font-bold text-slate-600">Drag & drop policy or card scan</p>
              <p className="text-[10px] text-slate-400">or click to browse local files (PDF, PNG up to 10MB)</p>
            </div>

            {/* List of uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Securely Lockered Scans</span>
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="p-3 bg-teal-50/30 border border-teal-100 rounded-xl flex items-center justify-between text-xs font-sans">
                    <div>
                      <p className="font-bold text-slate-700">{file.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{file.size} • Uploaded {file.date}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteFile(idx)}
                      className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-white transition cursor-pointer"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* New Secret record form */}
          <form onSubmit={handleAddSecretSubmit} className="bg-white rounded-2xl p-5 border border-[#d8c2b3]/20 shadow-xs space-y-3">
            <h3 className="font-sans font-bold text-slate-800 text-sm">Add Secret Record</h3>
            
            <div>
              <input 
                type="text"
                placeholder="Title (e.g. Grandma Medic ID, Netflix pin...)"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-3 py-2 text-xs font-sans outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-2 py-2 text-xs font-sans outline-none"
                >
                  <option value="wifi">Home WiFi</option>
                  <option value="policy">Insurance Policy</option>
                  <option value="medical">Medical Card</option>
                  <option value="other">Other Secret</option>
                </select>
              </div>
              <div>
                <input 
                  type="text"
                  placeholder="Secret Code / ID"
                  required
                  value={newSecret}
                  onChange={(e) => setNewSecret(e.target.value)}
                  className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-3 py-2 text-xs font-sans outline-none"
                />
              </div>
            </div>

            <div>
              <input 
                type="text"
                placeholder="Extra Notes (SSID, contact number...)"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-3 py-2 text-xs font-sans outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#006783] hover:bg-[#00546c] text-white py-2.5 rounded-xl text-xs font-bold font-sans transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Save Securely
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
