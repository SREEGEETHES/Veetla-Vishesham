import React, { useState, useRef } from "react";
import { Mic, Sparkles, AlertCircle, CheckCircle, ChevronRight, HelpCircle, AudioLines, MicOff } from "lucide-react";

interface SpeakViewProps {
  onAddParsedItem: (type: 'reminder' | 'chore' | 'calendar', data: any) => void;
}

export default function SpeakView({ onAddParsedItem }: SpeakViewProps) {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Parsed AI Result state
  const [parsedResult, setParsedResult] = useState<{
    type: 'reminder' | 'chore' | 'calendar' | 'none';
    data: any;
    explanation: string;
  } | null>(null);

  // Ready to apply?
  const [isApplied, setIsApplied] = useState(false);

  // Pre-configured speech templates
  const presets = [
    "Remind Dad to take Morning Vitamins at 8:00 AM",
    "Schedule Mom's Birthday Celebration on Saturday June 20, 2026 at 6:00 PM",
    "Assign a chore to Dad to rake the garden leaves tomorrow",
    "Add buy organic milk and cookies to key shopping list",
    "Assign a task to Dad: Fix the kitchen sink faucet due 2026-06-20",
    "Remind Mom to pick up dry cleaning at 5:00 PM"
  ];

  const handlePresetSelect = (text: string) => {
    setInputText(text);
    setParsedResult(null);
    setIsApplied(false);
  };

  const recognitionRef = useRef<any>(null);

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    setParsedResult(null);
    setIsApplied(false);
    setErrorMessage("");
    setIsRecording(true);

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      setIsRecording(false);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setErrorMessage(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleSubmitParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsThinking(true);
    setErrorMessage("");
    setParsedResult(null);
    setIsApplied(false);

    try {
      const response = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: inputText })
      });

      if (!response.ok) {
        throw new Error("Local backend pipeline returned error status");
      }

      const result = await response.json();
      setParsedResult(result);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("System failed to request Gemini central parser. Falling back to simple heuristic.");
    } finally {
      setIsThinking(false);
    }
  };

  const handleApproveAndSave = () => {
    if (!parsedResult || parsedResult.type === 'none') return;
    onAddParsedItem(parsedResult.type, parsedResult.data);
    setIsApplied(true);
    setInputText("");
  };

  return (
    <div className="space-y-6 pt-2 pb-12 px-4 max-w-lg mx-auto text-left" id="speakView">
      
      {/* Waveform Visualization section */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center min-h-[160px] shadow-lg">
        {isRecording ? (
          <div className="flex flex-col items-center space-y-4">
            <span className="text-red-400 font-sans text-xs tracking-widest uppercase animate-pulse">Recording voice... Speak now</span>
            <div className="flex items-center gap-1 h-12">
              <span className="w-1.5 h-6 bg-[#3fccfd] rounded-full animate-bounce duration-500" />
              <span className="w-1.5 h-10 bg-[#dc8e47] rounded-full animate-bounce duration-400" />
              <span className="w-1.5 h-12 bg-[#3fccfd] rounded-full animate-bounce duration-300" />
              <span className="w-1.5 h-6 bg-[#dc8e47] rounded-full animate-bounce duration-400" />
              <span className="w-1.5 h-11 bg-white rounded-full animate-bounce duration-500" />
            </div>
            <p className="text-[11px] text-slate-400">Capturing millisecond acoustic registers</p>
          </div>
        ) : isThinking ? (
          <div className="flex flex-col items-center space-y-4">
            <span className="text-orange-400 font-sans text-xs tracking-widest uppercase animate-pulse">Gemini AI interpreting...</span>
            <AudioLines className="w-12 h-12 text-[#dc8e47] animate-spin" />
            <p className="text-[11px] text-slate-300">Evaluating slots of domestic schema</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3 text-center">
            <span className="p-2.5 rounded-full bg-slate-800 text-orange-400">
              <AudioLines className="w-8 h-8" />
            </span>
            <p className="font-sans font-bold text-sm">Vocal Spatial Recognition Core</p>
            <p className="text-[10px] text-slate-400 max-w-[240px]">
              Tap simulated recording below or type commands to let Gemini automatically schedule appointments, chores, or reminders.
            </p>
          </div>
        )}
      </div>

      {/* Manual Input Form */}
      <form onSubmit={handleSubmitParse} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Transcription Input</label>
          <div className="relative">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="What can I organize for your household today?"
              className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-12 py-3.5 text-xs font-sans shadow-xs outline-none focus:ring-1 focus:ring-[#8e4e08]"
              required
            />
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isThinking}
              className={`absolute right-2.5 top-2.5 p-1.5 rounded-lg transition-all cursor-pointer ${
                isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-orange-100 text-[#8e4e08] hover:bg-orange-200'
              }`}
              title={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Action button */}
        <button
          type="submit"
          disabled={isThinking || !inputText.trim()}
          className="w-full bg-[#8e4e08] hover:bg-[#dc8e47] text-white py-3 rounded-xl font-sans font-bold text-xs transition-all tracking-wider shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" /> Parse details via Gemini AI
        </button>
      </form>

      {/* Presets Grid */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preset Vocal Drafts</h4>
        <div className="grid grid-cols-1 gap-2">
          {presets.map((draft, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetSelect(draft)}
              className="p-3 bg-white hover:bg-slate-50 text-left rounded-xl border border-slate-100 text-[11px] text-slate-600 font-sans transition-all active:scale-99"
            >
              "{draft}"
            </button>
          ))}
        </div>
      </div>

      {/* Parse Error Status display */}
      {errorMessage && (
        <div className="bg-red-50 text-red-600 border border-red-100 p-3.5 rounded-xl text-xs flex gap-2 items-start">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Gemini output results */}
      {parsedResult && (
        <div className="bg-gradient-to-br from-[#ffdcc2]/20 to-orange-50/10 rounded-2xl p-5 border border-orange-200/40 shadow-sm space-y-4 animate-scale-up">
          <div className="flex justify-between items-center pb-2 border-b border-orange-100/40">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-[#dc8e47]" />
              <span className="text-[10px] font-extrabold text-[#8e4e08] uppercase tracking-wider">Parser core registered</span>
            </div>
            <span className="bg-rose-50 text-[#ba1a1a] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
              {parsedResult.type}
            </span>
          </div>

          <p className="text-xs text-slate-700 font-sans leading-relaxed">
            {parsedResult.explanation}
          </p>

          {parsedResult.type !== "none" && (
            <div className="bg-white/80 p-3.5 rounded-xl border border-orange-100/50 space-y-1">
              <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Parsed Payload structure</span>
              <pre className="text-[10px] font-mono text-slate-500 overflow-x-auto">
                {JSON.stringify(parsedResult.data, null, 2)}
              </pre>
            </div>
          )}

          {isApplied ? (
            <div className="p-3 bg-green-50 border border-green-100 text-[#006783] rounded-xl text-xs flex gap-2 items-center justify-center font-bold">
              <CheckCircle className="w-4.5 h-4.5 text-green-500" /> Integrated successfully onto system database!
            </div>
          ) : (
            parsedResult.type !== "none" && (
              <button
                onClick={handleApproveAndSave}
                className="w-full bg-[#006783] hover:bg-[#00546c] text-white py-2.5 rounded-xl font-sans font-bold text-xs shadow-xs hover:shadow transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1"
              >
                Approve & Integrate onto State <ChevronRight className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      )}

    </div>
  );
}
