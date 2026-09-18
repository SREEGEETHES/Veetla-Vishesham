import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Clock,
  User as UserIcon,
  Phone,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Send,
  PhoneCall,
  Bell,
  AlertCircle
} from 'lucide-react';
import { ReminderItem, Language, User } from '../types';
import { translations } from '../i18n';
import { parseVoiceChore, ParsedTaskResult } from '../utils/parser';
import { soundCtrl } from '../utils/audio';

interface VoiceRecorderModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onSaveReminder: (reminder: ReminderItem) => void;
  currentUser: User | null;
  users: User[];
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  language,
  isOpen,
  onClose,
  onSaveReminder,
  currentUser,
  users
}) => {
  const t = translations[language];

  const myName = currentUser?.name || 'Myself';

  const defaultPrompt =
    language === 'ta'
      ? 'எனக்கு மாலை 5 மணிக்கு ரத்த அழுத்த மாத்திரை ஞாபகப்படுத்து'
      : `Remind me at 5 PM to take Blood Pressure medicine`;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(defaultPrompt);
  const [parsed, setParsed] = useState<ParsedTaskResult>(() =>
    parseVoiceChore(defaultPrompt, myName)
  );
  const [selectedAssignee, setSelectedAssignee] = useState(parsed.assignee);
  const [selectedMethod, setSelectedMethod] = useState<'call' | 'notification'>('call');
  const [taskName, setTaskName] = useState(parsed.taskTitle);
  const [scheduledSuccess, setScheduledSuccess] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Re-parse when transcript changes or language/user changes
  useEffect(() => {
    if (transcript) {
      const res = parseVoiceChore(transcript, myName);
      setParsed(res);
      setTaskName(res.taskTitle);
      setSelectedAssignee(res.assignee);
      setSelectedMethod(res.method);
    }
  }, [transcript, myName]);

  // Setup Web Speech API with Tamil (ta-IN) or English (en-US / en-IN)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const recognition = new SpeechRec();
      // Use continuous = true so pauses in Tamil speech don't stop mid-sentence
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        if (current.trim()) {
          setTranscript(current.trim());
          setSpeechError(null);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setSpeechError(
            language === 'ta'
              ? 'மைக்ரோஃபோன் அனுமதி தேவை (Microphone permission needed).'
              : 'Microphone permission blocked. Please allow mic access.'
          );
        } else if (event.error !== 'no-speech') {
          setSpeechError(event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleMic = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop?.();
      } catch {}
      setIsListening(false);
    } else {
      setSpeechError(null);
      setIsListening(true);
      soundCtrl.playPreviewTone();
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = language === 'ta' ? 'ta-IN' : 'en-US';
          recognitionRef.current.start();
        }
      } catch {
        // May already be started or not supported
      }
    }
  };

  const handleConfirm = () => {
    const newReminder: ReminderItem = {
      id: 'rem-' + Date.now(),
      title: taskName,
      time: parsed.targetTimeFormatted,
      targetTimestamp: parsed.targetDate.getTime(),
      callTimestamp: parsed.triggerDate.getTime(),
      assignee: selectedAssignee,
      status: 'pending',
      category: parsed.category,
      method: selectedMethod,
      isCalled: false
    };

    onSaveReminder(newReminder);
    setScheduledSuccess(true);
    soundCtrl.playCelebrationChime();

    setTimeout(() => {
      setScheduledSuccess(false);
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  // Build assignee list with "Myself" as FIRST PREFERENCE
  const assigneeOptions: { id: string; label: string }[] = [
    { id: myName, label: `Myself (${myName})` },
    ...users
      .filter((u) => u.name.toLowerCase() !== myName.toLowerCase())
      .map((u) => ({ id: u.name, label: u.name })),
    { id: 'Everyone', label: 'Everyone (Family)' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#F9F9F9] flex flex-col max-w-lg mx-auto overflow-y-auto">
      {/* Top Header */}
      <header className="sticky top-0 z-10 bg-[#F9F9F9]/95 backdrop-blur-md px-4 py-3 border-b border-[#D8C2B3]/60 flex items-center justify-between">
        <button
          onClick={() => {
            if (isListening) recognitionRef.current?.stop?.();
            onClose();
          }}
          className="p-2 rounded-full text-[#534438] hover:bg-black/5 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h3 className="font-extrabold text-sm text-[#1A0D0A]">
            {language === 'ta' ? 'குரல் வழி நினைவூட்டல்' : 'AI Voice Chore Assistant'}
          </h3>
          <p className="text-[10px] font-bold text-[#8E4E08]">
            {language === 'ta'
              ? 'தமிழ் & ஆங்கிலம் • தனிப்பட்ட அழைப்பு'
              : 'Bilingual Speech • Myself First Preference'}
          </p>
        </div>

        <div className="w-8" />
      </header>

      {/* Main Container */}
      <div className="flex-1 p-5 space-y-6">
        {/* Visual Live Transcription Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D8C2B3] relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8E4E08] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#DC8E47]" />
              {isListening
                ? language === 'ta'
                  ? 'தமிழ்க் குரலைக் கேட்கிறது...'
                  : 'Listening closely...'
                : language === 'ta'
                ? 'உங்கள் குரல் வாசகம் (தமிழ்):'
                : 'Live Speech Transcript:'}
            </span>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#006783]/10 text-[#006783]">
              {language === 'ta' ? 'ta-IN (தமிழ்)' : 'en-US'}
            </span>
          </div>

          <p className="text-base sm:text-lg font-semibold text-[#1A0D0A] min-h-[54px] leading-relaxed">
            "{transcript}"
          </p>

          {speechError && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{speechError}</span>
            </div>
          )}

          <p className="text-[11px] text-[#534438] mt-3 border-t border-[#D8C2B3]/40 pt-2 flex items-center justify-between">
            <span>
              {language === 'ta'
                ? 'முதல் முன்னுரிமை: எனக்கே (Myself) ஒதுக்கப்படும்'
                : 'Default: Assigned to Myself first'}
            </span>
            <span className="text-[10px] text-[#8E4E08] font-bold">
              Assignee: {selectedAssignee}
            </span>
          </p>
        </div>

        {/* Microphone Pulse Button */}
        <div className="flex flex-col items-center justify-center py-2">
          <button
            type="button"
            onClick={toggleMic}
            className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all cursor-pointer ${
              isListening
                ? 'bg-[#BA1A1A] ring-8 ring-[#BA1A1A]/20 animate-pulse scale-105'
                : 'bg-[#DC8E47] hover:brightness-105 active:scale-95'
            }`}
          >
            {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10 stroke-[2.2]" />}
          </button>

          <span className="text-xs font-black text-[#534438] uppercase tracking-wider mt-3">
            {isListening
              ? language === 'ta'
                ? 'பேசி முடித்ததும் தட்டவும்'
                : 'Tap to Finish Speaking'
              : language === 'ta'
              ? 'தமிழில் பேச தட்டவும்'
              : 'Tap to Speak New Chore'}
          </span>
        </div>

        {/* Preset Prompt Shortcuts based on current language */}
        <div className="space-y-1.5 text-center">
          <p className="text-[10px] font-extrabold text-[#857467] uppercase tracking-wider">
            {language === 'ta' ? 'மாதிரி வாக்கியங்கள் (தட்டவும்):' : 'Quick Tamil & English Presets (Tap to use):'}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {language === 'ta' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setTranscript('எனக்கு மாலை 5 மணிக்கு ரத்த அழுத்த மாத்திரை ஞாபகப்படுத்து');
                    soundCtrl.playPreviewTone();
                  }}
                  className="text-[11px] font-bold bg-white border border-[#D8C2B3] px-3 py-1.5 rounded-full text-[#534438] hover:border-[#DC8E47] hover:text-[#8E4E08] transition-all shadow-xs cursor-pointer"
                >
                  ⭐ எனக்கு மாலை 5 மணிக்கு மாத்திரை (Myself)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTranscript('சாயங்காலம் 6:00 மணிக்கு பால் வாங்கவும்');
                    soundCtrl.playPreviewTone();
                  }}
                  className="text-[11px] font-medium bg-white border border-[#D8C2B3] px-3 py-1.5 rounded-full text-[#534438] hover:border-[#DC8E47] hover:text-[#8E4E08] transition-all shadow-xs cursor-pointer"
                >
                  சாயங்காலம் 6:00 மணிக்கு பால் வாங்கவும்
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTranscript('அப்பாவுக்கு இரவு 8 மணிக்கு மருந்து கொடுக்கவும்');
                    soundCtrl.playPreviewTone();
                  }}
                  className="text-[11px] font-medium bg-white border border-[#D8C2B3] px-3 py-1.5 rounded-full text-[#534438] hover:border-[#DC8E47] hover:text-[#8E4E08] transition-all shadow-xs cursor-pointer"
                >
                  அப்பாவுக்கு இரவு 8 மணிக்கு மருந்து
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setTranscript('Remind me at 5 PM to take Blood Pressure medicine');
                    soundCtrl.playPreviewTone();
                  }}
                  className="text-[11px] font-bold bg-white border border-[#D8C2B3] px-3 py-1.5 rounded-full text-[#534438] hover:border-[#DC8E47] hover:text-[#8E4E08] transition-all shadow-xs cursor-pointer"
                >
                  ⭐ Remind me at 5 PM for BP medicine (Myself)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTranscript('Buy milk and groceries at 18:00');
                    soundCtrl.playPreviewTone();
                  }}
                  className="text-[11px] font-medium bg-white border border-[#D8C2B3] px-3 py-1.5 rounded-full text-[#534438] hover:border-[#DC8E47] hover:text-[#8E4E08] transition-all shadow-xs cursor-pointer"
                >
                  Buy milk at 18:00
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTranscript('Remind Dad at 20:00 to take insulin');
                    soundCtrl.playPreviewTone();
                  }}
                  className="text-[11px] font-medium bg-white border border-[#D8C2B3] px-3 py-1.5 rounded-full text-[#534438] hover:border-[#DC8E47] hover:text-[#8E4E08] transition-all shadow-xs cursor-pointer"
                >
                  Remind Dad at 20:00
                </button>
              </>
            )}
          </div>
        </div>

        {/* AI Detection & Extracted Task Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#D8C2B3]/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D8C2B3]/50">
            <div className="flex items-center gap-2">
              <span className="bg-[#3AC9FA]/20 text-[#006783] text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {t.aiDetection}
              </span>
              <h4 className="font-bold text-sm text-[#1A0D0A]">
                {t.extractedTask}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => {
                const res = parseVoiceChore(transcript, myName);
                setParsed(res);
                setTaskName(res.taskTitle);
              }}
              title="Reparse input"
              className="text-[#534438] hover:text-[#DC8E47] p-1 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Task Name Field */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#534438] block mb-1">
              {t.taskLabel}
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full text-base font-bold text-[#1A0D0A] p-2.5 bg-[#F9F9F9] border border-[#D8C2B3] rounded-xl focus:ring-2 focus:ring-[#DC8E47] focus:outline-none"
            />
          </div>

          {/* Pre-Call Time Display */}
          <div className="p-3.5 bg-[#FFDCC2]/40 rounded-xl border border-[#DC8E47]/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-[#8E4E08]" />
              <div>
                <p className="text-xs font-bold text-[#1A0D0A]">
                  Target Chore Time: <span className="text-[#8E4E08]">{parsed.targetTimeFormatted}</span>
                </p>
                <p className="text-[11px] text-[#534438]">
                  Automated Telegram Pre-Call: <span className="font-bold text-[#006783]">{parsed.triggerTimeFormatted}</span> (5 mins prior)
                </p>
              </div>
            </div>
          </div>

          {/* Assignee Selection (Myself First Preference) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#534438]">
                {t.assigneeLabel} (First Preference: Myself)
              </label>
              <span className="text-[10px] text-[#8E4E08] font-bold">
                Selected: {selectedAssignee}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {assigneeOptions.map((opt, idx) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedAssignee(opt.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedAssignee === opt.id
                      ? 'bg-[#8E4E08] text-white border-[#8E4E08] shadow-xs'
                      : idx === 0
                      ? 'bg-amber-50 text-[#8E4E08] border-[#DC8E47] font-extrabold'
                      : 'bg-[#F9F9F9] text-[#534438] border-[#D8C2B3] hover:border-[#DC8E47]'
                  }`}
                >
                  {idx === 0 && <UserIcon className="w-3 h-3" />}
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reminder Method Selection */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#534438] block mb-1">
              Reminder Channel (Telegram Call / Push)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'call' as const, label: 'Telegram Voice Call', icon: PhoneCall },
                { id: 'notification' as const, label: 'Push App Notification', icon: Bell }
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedMethod === m.id
                        ? 'bg-[#006783] text-white border-[#006783] shadow-xs'
                        : 'bg-[#F9F9F9] text-[#534438] border-[#D8C2B3] hover:border-[#006783]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Confirm & Send Button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-4 bg-[#8E4E08] hover:bg-[#DC8E47] text-white text-base font-extrabold rounded-2xl shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {scheduledSuccess ? (
            <>
              <CheckCircle2 className="w-5 h-5 animate-bounce" />
              <span>Reminder Scheduled!</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>{t.confirmSend}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
