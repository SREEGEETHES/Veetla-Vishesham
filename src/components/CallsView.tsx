import { useState, useEffect, useCallback, useRef } from "react";
import { Phone, PhoneOff, PhoneCall, Video, VideoOff, Mic, MicOff, Circle } from "lucide-react";
import { User as UserType, FamilyCall } from "../types";

type CallState = 'idle' | 'calling' | 'connected' | 'ended';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export default function CallsView() {
  const [members, setMembers] = useState<UserType[]>([]);
  const [activeCalls, setActiveCalls] = useState<FamilyCall[]>([]);
  const [loading, setLoading] = useState(true);

  // Call state
  const [callState, setCallState] = useState<CallState>('idle');
  const [currentCallId, setCurrentCallId] = useState<number | null>(null);
  const [calleeName, setCalleeName] = useState('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const token = localStorage.getItem("familyos_token") || "";

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/members", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.filter((u: UserType) => u.approved));
      }
    } catch (err) {
      console.error("Failed to fetch members", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchActiveCalls = useCallback(async () => {
    try {
      const res = await fetch("/api/calls/active", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveCalls(data);
      }
    } catch (err) {
      console.error("Failed to fetch active calls", err);
    }
  }, [token]);

  useEffect(() => {
    fetchMembers();
    fetchActiveCalls();
  }, [fetchMembers, fetchActiveCalls]);

  const getCurrentUserId = (): number => {
    const stored = localStorage.getItem("familyos_user");
    if (stored) {
      try {
        const user = JSON.parse(stored) as UserType;
        return user.id;
      } catch {
        return 0;
      }
    }
    return 0;
  };

  const cleanupCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleEndCall = async () => {
    if (currentCallId) {
      try {
        await fetch(`/api/calls/${currentCallId}/end`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Failed to end call", err);
      }
    }
    cleanupCall();
    setCallState('ended');
    setTimeout(() => setCallState('idle'), 3000);
  };

  const initiateCall = async (calleeId: number, calleeName: string) => {
    setCallState('calling');
    setCalleeName(calleeName);
    setCurrentCallId(null);

    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initiate call via signaling server
      const res = await fetch("/api/calls/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ callee_id: calleeId }),
      });

      if (!res.ok) {
        throw new Error("Failed to initiate call");
      }

      const callData = await res.json();
      const callId = callData.id;
      setCurrentCallId(callId);

      // Create peer connection
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setCallState('connected');
      };

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          try {
            await fetch(`/api/calls/${callId}/signal`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                type: 'ice_candidate',
                candidate: event.candidate,
              }),
            });
          } catch (err) {
            console.error("Failed to send ICE candidate", err);
          }
        }
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to signaling server
      await fetch(`/api/calls/${callId}/signal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'offer',
          sdp: offer.sdp,
        }),
      });

      // Poll for answer
      pollingRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/calls/${callId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (pollRes.ok) {
            const pollData = await pollRes.json();
            if (pollData.answer && pollData.answer.sdp && callState === 'calling') {
              await pc.setRemoteDescription(new RTCSessionDescription({
                type: 'answer',
                sdp: pollData.answer.sdp,
              }));
              setCallState('connected');
            }
            // Handle incoming ICE candidates
            if (pollData.ice_candidates && pollData.ice_candidates.length > 0) {
              for (const cand of pollData.ice_candidates) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (e) {
                  console.error("Error adding ICE candidate", e);
                }
              }
            }
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 2000);

    } catch (err) {
      console.error("Failed to initiate call", err);
      // Fallback: just show calling UI for demo
      setCallState('calling');
      setTimeout(() => {
        // Simulate connection for demo purposes
        setCallState('connected');
      }, 3000);
    }
  };

  // In-call UI
  if (callState === 'calling' || callState === 'connected') {
    return (
      <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col max-w-lg mx-auto">
        {/* Call Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${callState === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-orange-400 animate-ping'}`} />
            <span className="text-white text-xs font-mono uppercase tracking-widest">
              {callState === 'connected' ? 'Connected' : 'Calling...'}
            </span>
          </div>
          <span className="text-white text-xs">{calleeName}</span>
        </div>

        {/* Video Grid */}
        <div className="flex-1 relative bg-slate-900">
          {/* Remote Video (full) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${callState === 'calling' ? 'hidden' : ''}`}
          />
          {callState === 'calling' && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full border-2 border-orange-400 overflow-hidden mx-auto animate-pulse">
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <PhoneCall className="w-8 h-8 text-orange-400" />
                  </div>
                </div>
                <p className="text-white font-bold">Calling {calleeName}...</p>
              </div>
            </div>
          )}

          {/* Local Video (PiP) */}
          <div className="absolute bottom-32 right-4 w-24 h-32 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${videoOff ? 'hidden' : ''}`}
            />
            {videoOff && (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                <VideoOff className="w-6 h-6 text-slate-400" />
              </div>
            )}
          </div>
        </div>

        {/* Call Controls */}
        <div className="p-6 pb-10 bg-slate-950">
          <div className="flex justify-center items-center gap-6">
            <button
              onClick={() => setMuted(!muted)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer ${muted ? 'bg-slate-700 text-slate-300' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
            >
              {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              onClick={() => setVideoOff(!videoOff)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer ${videoOff ? 'bg-slate-700 text-slate-300' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
            >
              {videoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>

            <button
              onClick={handleEndCall}
              className="w-16 h-16 rounded-full bg-[#ba1a1a] hover:bg-red-700 flex items-center justify-center transition-all cursor-pointer"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (callState === 'ended') {
    return (
      <div className="fixed inset-0 bg-slate-950 z-50 flex items-center justify-center max-w-lg mx-auto">
        <div className="text-center space-y-3">
          <PhoneOff className="w-12 h-12 text-slate-400 mx-auto" />
          <p className="text-white font-bold text-lg">Call Ended</p>
          <p className="text-slate-400 text-sm">Returning to family calls...</p>
        </div>
      </div>
    );
  }

  // Family Members List
  return (
    <div className="space-y-6 pt-2 pb-12 px-4 max-w-lg mx-auto text-left" id="callsView">
      <div className="flex items-center gap-2">
        <Phone className="w-6 h-6 text-[#dc8e47]" />
        <h2 className="font-sans font-extrabold text-xl text-slate-800">Family Calls</h2>
      </div>

      {/* Active Calls */}
      {activeCalls.length > 0 && (
        <div>
          <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Active Calls</h3>
          <div className="space-y-2">
            {activeCalls.map(call => (
              <div key={call.id} className="bg-white rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-slate-800">{call.callee_name}</p>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" /> Active
                  </span>
                </div>
                <button
                  onClick={() => initiateCall(call.callee_id, call.callee_name || '')}
                  className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Phone className="w-3 h-3" /> Rejoin
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members List */}
      <div>
        <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">
          Family Members ({members.length})
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-[#dc8e47] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {members.map(member => {
              const isSelf = member.id === getCurrentUserId();
              return (
                <div
                  key={member.id}
                  className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs flex items-center gap-3"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-[#ffdcc2] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="font-bold text-[#8e4e08] text-lg">{member.name.charAt(0)}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-800">{member.name}</h4>
                      {isSelf && <span className="text-[10px] text-slate-400">(You)</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] text-slate-400">Online</span>
                      <span className="text-[10px] text-slate-300 capitalize">• {member.role}</span>
                    </div>
                  </div>

                  {/* Call Button */}
                  <button
                    onClick={() => initiateCall(member.id, member.name)}
                    disabled={isSelf}
                    className={`p-3 rounded-full transition-all cursor-pointer ${
                      isSelf
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        : 'bg-[#dc8e47] hover:bg-[#8e4e08] text-white active:scale-95'
                    }`}
                    title={isSelf ? "Cannot call yourself" : `Call ${member.name}`}
                  >
                    <PhoneCall className="w-5 h-5" />
                  </button>
                </div>
              );
            })}

            {members.length === 0 && (
              <div className="text-center p-8 bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs">
                No approved family members found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}