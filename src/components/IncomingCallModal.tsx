import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Check, Volume2, Send, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n';
import { soundCtrl } from '../utils/audio';

interface IncomingCallModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onCompleteChore: (reminderId?: string) => void;
  language: Language;
  callerName?: string;
  reminderId?: string;
  choreTitle?: string;
  assigneeName?: string;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  isOpen,
  onAccept,
  onDecline,
  onCompleteChore,
  language,
  callerName = 'Telegram Family Assistant Bot',
  reminderId,
  choreTitle = 'Personal Reminder',
  assigneeName = 'Family Member'
}) => {
  const t = translations[language];
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'completed'>('ringing');
  const [callSeconds, setCallSeconds] = useState(0);

  // Handle ringing sound & spoken reminder
  useEffect(() => {
    if (isOpen) {
      setCallState('ringing');
      setCallSeconds(0);
      soundCtrl.startIncomingCallRing();
    } else {
      soundCtrl.stopRing();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }

    return () => {
      soundCtrl.stopRing();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  // Call duration counter
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const handleAnswer = () => {
    soundCtrl.stopRing();
    setCallState('connected');
    onAccept();

    // Play a warm comforting acoustic chime, then speak with heartfelt familial tone
    soundCtrl.playWarmGreetingChime();
    setTimeout(() => {
      const message =
        language === 'ta'
          ? `அன்புள்ள ${assigneeName}, உங்கள் குடும்பத்தின் பாசமான நினைவூட்டல்: ${choreTitle}. உடம்பை நல்லா பார்த்துக்கோங்க, முடிஞ்சதும் மறக்காம தெரியப்படுத்துங்க!`
          : `Hi ${assigneeName}! Loving reminder from your family: ${choreTitle}. Please take good care of yourself, we love you!`;
      soundCtrl.speakText(message, language);
    }, 700);
  };

  const handleHangup = () => {
    soundCtrl.stopRing();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    onDecline();
  };

  const handleMarkDone = () => {
    soundCtrl.stopRing();
    setCallState('completed');
    soundCtrl.playCelebrationChime();
    setTimeout(() => {
      onCompleteChore(reminderId);
    }, 1000);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-8 text-white max-w-lg mx-auto backdrop-blur-md animate-in fade-in duration-300">
      {/* Top Telegram Header */}
      <div className="text-center pt-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#229ED9]/30 border border-[#229ED9] rounded-full text-xs font-bold text-[#3AC9FA]">
          <Send className="w-3.5 h-3.5" /> Telegram Automated Call
        </div>

        <p className="text-xs uppercase tracking-widest text-white/70 font-extrabold pt-1">
          {callState === 'ringing'
            ? (language === 'ta' ? 'டெலிகிராம் அழைப்பு வருகிறது...' : 'Incoming Telegram Voice Call...')
            : callState === 'connected'
            ? `Telegram Voice Call • ${formatSeconds(callSeconds)}`
            : (language === 'ta' ? 'வேலை முடிந்தது!' : 'Chore Confirmed!')}
        </p>
        <h2 className="text-3xl font-black tracking-tight">{callerName}</h2>
        <p className="text-sm font-medium text-white/80">Private call for {assigneeName}</p>
      </div>

      {/* Center Avatar / Visualizer */}
      <div className="flex flex-col items-center my-auto space-y-5">
        <div className="relative">
          <div
            className={`w-32 h-32 rounded-full border-4 border-[#229ED9] overflow-hidden shadow-2xl flex items-center justify-center bg-[#229ED9]/20 ${
              callState === 'ringing' ? 'animate-pulse ring-8 ring-[#229ED9]/40' : ''
            }`}
          >
            <div className="w-24 h-24 rounded-full bg-[#229ED9] flex items-center justify-center text-white shadow-inner">
              <Send className="w-12 h-12 ml-1" />
            </div>
          </div>
        </div>

        {/* Spoken Reminder Details */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl max-w-xs text-center space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#DC8E47] font-extrabold uppercase tracking-wider">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>{language === 'ta' ? 'நினைவூட்டல்' : 'Personal Chore Alert'}</span>
          </div>
          <p className="text-sm font-bold text-white">"{choreTitle}"</p>
          <p className="text-[11px] text-white/75">
            {language === 'ta' ? 'டெலிகிராம் தானியங்கி குரல் அழைப்பு' : 'Automated Telegram reminder call'}
          </p>
        </div>
      </div>

      {/* Bottom Call Controls */}
      <div className="w-full pb-8">
        {callState === 'ringing' && (
          <div className="flex items-center justify-around w-full max-w-xs mx-auto">
            {/* Decline Call */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleHangup}
                className="w-16 h-16 bg-[#BA1A1A] hover:bg-red-700 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all text-white cursor-pointer"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-xs font-bold text-white/80">
                {language === 'ta' ? 'நிராகரிக்கவும்' : 'Decline'}
              </span>
            </div>

            {/* Answer Call */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleAnswer}
                className="w-16 h-16 bg-emerald-600 hover:bg-emerald-500 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all text-white animate-bounce cursor-pointer"
              >
                <Phone className="w-7 h-7" />
              </button>
              <span className="text-xs font-bold text-white/80">
                {language === 'ta' ? 'அழைப்பை ஏற்கவும்' : 'Answer Call'}
              </span>
            </div>
          </div>
        )}

        {callState === 'connected' && (
          <div className="space-y-4 max-w-xs mx-auto text-center">
            <button
              onClick={handleMarkDone}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-sm shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>{language === 'ta' ? 'வேலையை முடித்துவிட்டேன்' : 'Mark Chore as Completed'}</span>
            </button>

            <button
              onClick={handleHangup}
              className="w-14 h-14 bg-[#BA1A1A] hover:bg-red-700 rounded-full mx-auto flex items-center justify-center text-white active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        )}

        {callState === 'completed' && (
          <div className="text-center p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl flex flex-col items-center gap-1.5 animate-in zoom-in duration-200">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <p className="text-base font-extrabold text-emerald-400">
              {language === 'ta' ? 'வேலை முடிந்தது என குறிக்கப்பட்டது!' : 'Chore Marked as Completed!'}
            </p>
            <p className="text-xs text-white/80">
              Synced with your personal schedule & Telegram status.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
