import React, { useState, useEffect } from "react";
import { AlertOctagon, HeartHandshake, PhoneCall, ShieldAlert, CheckCircle, Navigation, Radio } from "lucide-react";
import { SOSStatus } from "../types";

interface SOSViewProps {
  sosStatuses: SOSStatus[];
  onAddSOSStatus: (status: Omit<SOSStatus, "id" | "timestamp">) => void;
  onClearSOS: () => void;
}

export default function SOSView({ sosStatuses, onAddSOSStatus, onClearSOS }: SOSViewProps) {
  const [sosPulsing, setSosPulsing] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [customMsg, setCustomMsg] = useState("");
  const [familyStatus, setFamilyStatus] = useState<'safe' | 'assistance'>('safe');
  const [reporterName, setReporterName] = useState("Dad");

  // Fetch true geolocation coordinates (requestFramePermissions is granted in metadata)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => {
          console.warn("Geolocation coordinate acquisition failed or blocked. Fallback applied", err);
          // Default to San Francisco
          setCoords({ lat: 37.7749, lng: -122.4194 });
        }
      );
    } else {
      setCoords({ lat: 37.7749, lng: -122.4194 });
    }
  }, []);

  // SOS Countdown timer
  useEffect(() => {
    let timer: any;
    if (sosPulsing && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      // countdown finished, trigger state upload automatically
      onAddSOSStatus({
        name: "SOS SYSTEM Dispatcher",
        status: "assistance",
        message: "SYSTEM DISPATCH INITIATED. Local Coordinate Rescue Broadcast triggered.",
        coordinates: coords ? { latitude: coords.lat, longitude: coords.lng } : undefined
      });
      setCountdown(5);
      setSosPulsing(false);
    }

    return () => clearInterval(timer);
  }, [sosPulsing, countdown]);

  const handlePanicTrigger = () => {
    setSosPulsing(true);
    setCountdown(5);
  };

  const handleStopPanic = () => {
    setSosPulsing(false);
    setCountdown(5);
  };

  const handleSubmitStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;
    onAddSOSStatus({
      name: reporterName,
      status: familyStatus,
      message: customMsg,
      coordinates: coords ? { latitude: coords.lat, longitude: coords.lng } : undefined
    });
    setCustomMsg("");
  };

  return (
    <div className="space-y-6 pt-2 pb-12 px-4 max-w-lg mx-auto text-left" id="sosView">
      
      {/* HIGH VISIBILITY PANIC BUTTON TRIGGER */}
      <div className="bg-[#ffdad6] border-2 border-[#ba1a1a]/40 rounded-2xl p-5 text-center space-y-4 relative overflow-hidden">
        
        {sosPulsing ? (
          <div className="space-y-4 animate-pulse">
            <Radio className="w-12 h-12 text-[#ba1a1a] mx-auto animate-ping" />
            <h3 className="font-sans font-black text-2xl text-[#ba1a1a] uppercase tracking-wider">Broadcasting Distress Beacon</h3>
            <p className="text-sm font-semibold text-slate-700">
              Emergency dispatch in progress... <span className="font-black text-lg underline ml-1">{countdown}s</span>
            </p>
            <p className="text-xs text-slate-500 font-mono">
              GPS Coordinates: {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Acquiring..."}
            </p>
            <button 
              onClick={handleStopPanic}
              className="px-6 py-2 bg-slate-800 text-white rounded-full font-bold uppercase text-xs hover:bg-[#ba1a1a] transition-all cursor-pointer shadow-md"
            >
              Abort Beacon Broadcast
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <ShieldAlert className="w-12 h-12 text-[#ba1a1a] mx-auto" />
            <div>
              <h3 className="font-sans font-extrabold text-[#ba1a1a] text-lg">Central Panic Beacon</h3>
              <p className="text-xs text-[#93000a] mt-0.5">
                Press to notify all household members instantly and calculate immediate vector dispatch coordinates.
              </p>
            </div>
            
            <button
              onClick={handlePanicTrigger}
              className="w-full bg-[#ba1a1a] hover:bg-[#93000a] text-white py-3.5 rounded-full font-sans font-extrabold text-sm uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer border-none"
            >
              🚨 Broadcast Distress Alert
            </button>
          </div>
        )}
      </div>

      {/* EMERGENCY CONTACT DIRECTORY SHORTCUTS */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Domestic Rescue Directory</h4>
        
        <div className="grid grid-cols-1 gap-2.5">
          <a 
            href="tel:911" 
            className="flex items-center justify-between p-3 bg-red-50 hover:bg-red-100/50 rounded-xl border border-red-200/40 text-xs font-sans text-[#ba1a1a] font-bold"
          >
            <span className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4" /> 911 Emergency Services
            </span>
            <span className="bg-[#ba1a1a] text-white text-[10px] px-2 py-0.5 rounded-full">Call</span>
          </a>

          <a 
            href="tel:18002221222" 
            className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-sans text-slate-700 font-bold"
          >
            <span className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4" /> Poison Control Center
            </span>
            <span className="bg-slate-700 text-white text-[10px] px-2 py-0.5 rounded-full">Call</span>
          </a>

          <div className="flex items-center justify-between p-3 bg-[#fdfaf7] rounded-xl border border-orange-100 text-xs font-sans text-[#8e4e08] font-bold">
            <span className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4" /> Neighbourhood Safehouse
            </span>
            <span className="text-[10px] text-slate-400">0.4 km away</span>
          </div>
        </div>
      </div>

      {/* DISPATCH ACTIVE RESCUE ALERTS FEED */}
      {sosStatuses.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Safe-check Log</span>
            <button 
              onClick={onClearSOS}
              className="text-[10px] font-bold text-[#ba1a1a] hover:underline cursor-pointer"
            >
              Clear Records
            </button>
          </div>

          <div className="space-y-2.5">
            {sosStatuses.map((sos) => (
              <div 
                key={sos.id}
                className={`bg-white rounded-xl p-4 border shadow-xs text-left ${
                  sos.status === 'assistance' ? 'border-red-200 bg-red-50/20' : 'border-green-200 bg-green-50/20'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-sans font-bold text-slate-800 text-sm">{sos.name}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    sos.status === 'assistance' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {sos.status === 'assistance' ? 'Assistance Needed' : 'Marked Safe'}
                  </span>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed font-sans">{sos.message}</p>
                
                {sos.coordinates && (
                  <p className="text-[9px] font-mono text-slate-400 mt-2 flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5" /> GPS Coordinates: {sos.coordinates.latitude.toFixed(4)}, {sos.coordinates.longitude.toFixed(4)}
                  </p>
                )}
                <span className="text-[9px] text-slate-300 block mt-2">{sos.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBMIT INDIVIDUAL MEMBER OK / HELP RECOVERY UPDATE */}
      <form onSubmit={handleSubmitStatus} className="bg-white rounded-2xl p-5 border border-[#d8c2b3]/20 shadow-xs space-y-3">
        <h3 className="font-sans font-bold text-slate-800 text-sm mb-1">Broadcast Safety Status</h3>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Family Member</label>
            <select
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-sans outline-none"
            >
              <option value="Dad">Dad</option>
              <option value="Mom">Mom</option>
              <option value="Kids">Kids</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
            <select
              value={familyStatus}
              onChange={(e) => setFamilyStatus(e.target.value as any)}
              className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-1.5 py-1.5 text-xs font-sans outline-none"
            >
              <option value="safe">✅ Marked Safe</option>
              <option value="assistance">⚠️ Needs Assistance</option>
            </select>
          </div>
        </div>

        <div>
          <input 
            type="text"
            placeholder="Type check-in context (e.g. Traffic delays, safe at home...)"
            required
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            className="w-full bg-[#fdfaf7] border border-slate-200 rounded-xl px-3 py-2 text-xs font-sans outline-none focus:ring-1 focus:ring-[#ba1a1a]"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold font-sans transition-all active:scale-98 shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
        >
          <CheckCircle className="w-4 h-4" /> Log Safety Status
        </button>
      </form>

    </div>
  );
}
