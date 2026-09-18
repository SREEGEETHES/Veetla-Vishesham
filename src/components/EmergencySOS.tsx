import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Radio,
  Shield,
  MapPin,
  BatteryCharging,
  Phone,
  HeartPulse,
  ArrowLeft,
  X,
  Volume2,
  VolumeX,
  Send
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n';
import { soundCtrl } from '../utils/audio';

interface EmergencySOSProps {
  language: Language;
  onBack: () => void;
}

export const EmergencySOS: React.FC<EmergencySOSProps> = ({
  language,
  onBack
}) => {
  const t = translations[language];

  const [coords, setCoords] = useState<string>('40.7128° N, 74.0060° W');
  const [batteryLevel, setBatteryLevel] = useState<string>('84%');
  const [sosActive, setSosActive] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [showMedicalId, setShowMedicalId] = useState(false);
  const [showDirectCallModal, setShowDirectCallModal] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  // Fetch real geolocation if permitted
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4);
          const lng = pos.coords.longitude.toFixed(4);
          const latDir = pos.coords.latitude >= 0 ? 'N' : 'S';
          const lngDir = pos.coords.longitude >= 0 ? 'E' : 'W';
          setCoords(`${Math.abs(Number(lat))}° ${latDir}, ${Math.abs(Number(lng))}° ${lngDir}`);
        },
        () => {
          // Keep default prototype fallback
        },
        { timeout: 5000 }
      );
    }

    // Battery API check
    const nav = navigator as unknown as { getBattery?: () => Promise<{ level: number; charging: boolean }> };
    if (nav.getBattery) {
      nav.getBattery().then((battery) => {
        setBatteryLevel(`${Math.round(battery.level * 100)}%`);
      }).catch(() => {});
    }
  }, []);

  const handleTriggerSOS = () => {
    setSosActive(true);
    setSosSent(true);

    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }

    if (!soundMuted) {
      soundCtrl.startEmergencySiren();
    }
  };

  const handleCancelSOS = () => {
    setSosActive(false);
    setSosSent(false);
    soundCtrl.stopEmergencySiren();
  };

  return (
    <main className="max-w-lg mx-auto px-4 pt-2 pb-32 flex flex-col items-center justify-center">
      {/* Top Header bar with Back button */}
      <div className="w-full flex items-center justify-between py-2 mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-bold text-[#534438] hover:text-[#1A0D0A] p-2 rounded-xl hover:bg-black/5 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <span className="text-xs font-bold text-[#BA1A1A] bg-[#FFDAD6] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          {t.criticalAlert}
        </span>
      </div>

      {/* Header text */}
      <div className="text-center mb-6 space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A0D0A] leading-tight max-w-sm mx-auto">
          {t.sosHeadline}
        </h2>
      </div>

      {/* Giant Pulsating SOS Button */}
      <div className="relative flex items-center justify-center w-full aspect-square max-w-[300px] mb-7">
        {/* Pulsing ripple rings */}
        <div
          className={`absolute w-full h-full rounded-full bg-[#BA1A1A]/20 transition-all ${
            sosActive ? 'animate-ping' : 'animate-pulse'
          }`}
        />
        <div
          className="absolute w-[85%] h-[85%] rounded-full bg-[#BA1A1A]/30 animate-pulse"
          style={{ animationDelay: '0.5s' }}
        />

        {/* Center Main SOS Button */}
        <button
          id="sosEmergencyMainButton"
          onClick={sosActive ? handleCancelSOS : handleTriggerSOS}
          className={`relative z-10 w-[72%] h-[72%] rounded-full flex flex-col items-center justify-center text-white active:scale-95 transition-all duration-200 shadow-2xl ${
            sosActive
              ? 'bg-[#006783] ring-8 ring-[#3AC9FA]/40'
              : 'bg-[#BA1A1A] hover:brightness-110'
          }`}
          style={{
            boxShadow: sosActive
              ? '0 0 50px rgba(58, 201, 250, 0.5)'
              : '0 0 45px rgba(186, 26, 26, 0.45)'
          }}
        >
          {sosSent ? (
            <>
              <Send className="w-14 h-14 mb-1 animate-bounce" />
              <span className="text-3xl font-black tracking-wider">SENT</span>
              <span className="text-[11px] font-bold uppercase tracking-widest mt-1 opacity-90">
                Tap to Cancel
              </span>
            </>
          ) : (
            <>
              <Radio className="w-14 h-14 mb-1 stroke-[2.5]" />
              <span className="text-4xl font-black tracking-tighter">SOS</span>
              <span className="text-[11px] font-bold uppercase tracking-widest mt-1 opacity-90">
                Hold / Tap
              </span>
            </>
          )}
        </button>
      </div>

      {/* Siren Sound Toggle */}
      {sosActive && (
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => {
              if (soundMuted) {
                soundCtrl.startEmergencySiren();
                setSoundMuted(false);
              } else {
                soundCtrl.stopEmergencySiren();
                setSoundMuted(true);
              }
            }}
            className="text-xs bg-white border border-[#D8C2B3] px-3 py-1.5 rounded-full font-bold text-[#BA1A1A] flex items-center gap-1.5 shadow-xs"
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
            {soundMuted ? 'Unmute Siren' : 'Mute Siren'}
          </button>
        </div>
      )}

      {/* Protocol Card */}
      <div className="w-full bg-white border-l-4 border-[#006783] rounded-xl border border-[#D8C2B3]/60 p-5 shadow-xs mb-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#3AC9FA]/15 text-[#006783] rounded-xl flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#1A0D0A] mb-1">
              {t.sosProtocolTitle}
            </h3>
            <p className="text-xs sm:text-sm text-[#534438] leading-relaxed">
              {t.sosProtocolDesc}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3.5 border-t border-[#D8C2B3]/60 flex items-center justify-between text-xs text-[#534438] font-medium">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-[#BA1A1A]" />
            Current: {coords}
          </span>
          <span className="flex items-center gap-1">
            <BatteryCharging className="w-4 h-4 text-emerald-600" />
            {batteryLevel}
          </span>
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <button
          onClick={() => setShowDirectCallModal(true)}
          className="flex flex-col items-center justify-center p-4 bg-white border border-[#D8C2B3]/70 rounded-xl hover:bg-[#F3F3F3] active:scale-95 transition-all shadow-2xs group"
        >
          <Phone className="w-6 h-6 text-[#006783] mb-1.5 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-sm text-[#1A0D0A]">{t.call911}</span>
          <span className="text-[10px] text-[#534438]">Emergency Dispatch</span>
        </button>

        <button
          onClick={() => setShowMedicalId(true)}
          className="flex flex-col items-center justify-center p-4 bg-white border border-[#D8C2B3]/70 rounded-xl hover:bg-[#F3F3F3] active:scale-95 transition-all shadow-2xs group"
        >
          <HeartPulse className="w-6 h-6 text-[#8E4E08] mb-1.5 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-sm text-[#1A0D0A]">{t.medicalId}</span>
          <span className="text-[10px] text-[#534438]">Blood & Allergies</span>
        </button>
      </div>

      {/* Direct 911 / 112 Call Modal */}
      {showDirectCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-[#D8C2B3] text-center">
            <div className="w-14 h-14 rounded-full bg-[#FFDAD6] text-[#BA1A1A] mx-auto flex items-center justify-center mb-3">
              <Phone className="w-7 h-7" />
            </div>
            <h4 className="text-xl font-bold text-[#1A0D0A] mb-1">
              Direct Emergency Call
            </h4>
            <p className="text-xs text-[#534438] mb-5">
              Connect immediately to local emergency dispatch services (112 / 911).
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDirectCallModal(false)}
                className="flex-1 py-3 bg-[#F3F3F3] font-bold text-sm rounded-xl text-[#534438]"
              >
                Cancel
              </button>
              <a
                href="tel:112"
                onClick={() => setShowDirectCallModal(false)}
                className="flex-1 py-3 bg-[#BA1A1A] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-1.5 hover:brightness-110 shadow-sm"
              >
                <Phone className="w-4 h-4" /> Dial Now
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Medical ID Modal */}
      {showMedicalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-[#D8C2B3]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-[#8E4E08]">
                <HeartPulse className="w-6 h-6" />
                <h4 className="text-lg font-bold text-[#1A0D0A]">
                  Family Medical ID
                </h4>
              </div>
              <button
                onClick={() => setShowMedicalId(false)}
                className="p-1 rounded-full text-[#534438] hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm bg-[#F9F9F9] p-4 rounded-xl border border-[#D8C2B3]/60 mb-5">
              <div className="flex justify-between border-b border-[#D8C2B3]/40 pb-2">
                <span className="text-[#534438]">Primary Patient:</span>
                <span className="font-bold">Dad (Alexander Vance)</span>
              </div>
              <div className="flex justify-between border-b border-[#D8C2B3]/40 pb-2">
                <span className="text-[#534438]">Blood Group:</span>
                <span className="font-bold text-[#BA1A1A]">O Positive (O+)</span>
              </div>
              <div className="flex justify-between border-b border-[#D8C2B3]/40 pb-2">
                <span className="text-[#534438]">Allergies:</span>
                <span className="font-bold">Penicillin, Peanuts</span>
              </div>
              <div className="flex justify-between border-b border-[#D8C2B3]/40 pb-2">
                <span className="text-[#534438]">Medical Conditions:</span>
                <span className="font-bold">Hypertension (BP)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#534438]">Emergency Contact:</span>
                <span className="font-bold text-[#006783]">+91 98401 23456 (Amma)</span>
              </div>
            </div>

            <button
              onClick={() => setShowMedicalId(false)}
              className="w-full py-2.5 bg-[#1A0D0A] text-white font-bold rounded-xl text-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
