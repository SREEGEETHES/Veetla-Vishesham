/**
 * Web Audio API synthesizer and Speech synthesis helpers for FamilyOS
 * Enhanced with warm acoustic chimes and human-like emotional speech synthesis
 */

class SoundController {
  private ctx: AudioContext | null = null;
  private ringtoneInterval: number | null = null;
  private sirenInterval: number | null = null;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'suspended') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play gentle warm acoustic harp chime before speaking for emotional connection
  playWarmGreetingChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      // Warm Major 7th chord: F4 -> A4 -> C5 -> E5
      const notes = [349.23, 440.0, 523.25, 659.25];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.001, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.1 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.65);
      });
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  // Play smooth preview tone for reminder voice selection
  playPreviewTone() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Chord: C4 -> E4 -> G4 -> C5
      const notes = [261.63, 329.63, 392.0, 523.25];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.45);
      });
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  // Play celebration toast chime
  playCelebrationChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const freqs = [440, 554.37, 659.25, 880, 1108.73];

      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.08);

        gain.gain.setValueAtTime(0.01, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.65);
      });
    } catch {
      // ignore
    }
  }

  // Play incoming phone call ringtone
  startIncomingCallRing() {
    this.stopRing();
    const playRingCycle = () => {
      try {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        [0, 0.4].forEach((offset) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(440, now + offset);
          osc2.frequency.setValueAtTime(480, now + offset);

          gain.gain.setValueAtTime(0, now + offset);
          gain.gain.linearRampToValueAtTime(0.18, now + offset + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.3);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now + offset);
          osc2.start(now + offset);
          osc1.stop(now + offset + 0.35);
          osc2.stop(now + offset + 0.35);
        });
      } catch {
        // ignore
      }
    };

    playRingCycle();
    this.ringtoneInterval = window.setInterval(playRingCycle, 2400);
  }

  stopRing() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  // Play emergency SOS siren sound
  startEmergencySiren() {
    this.stopEmergencySiren();
    let toggle = false;
    const playSirenBurst = () => {
      try {
        const ctx = this.getContext();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(toggle ? 950 : 650, now);
        toggle = !toggle;

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.48);
      } catch {
        // ignore
      }
    };
    playSirenBurst();
    this.sirenInterval = window.setInterval(playSirenBurst, 500);
  }

  stopEmergencySiren() {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
  }

  /**
   * Text-To-Speech with human warmth and emotional cadence
   * Configured to avoid robotic monotone speech
   */
  speakText(text: string, lang: 'en' | 'ta' = 'en') {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Unhurried natural cadence (0.88) sounds caring rather than rushed
    utterance.rate = 0.88;
    // Slightly elevated warm pitch gives an affectionate familial tone
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    if (lang === 'ta') {
      const tamilVoice = voices.find(
        (v) =>
          v.lang.includes('ta') ||
          v.name.toLowerCase().includes('tamil') ||
          v.name.toLowerCase().includes('valluvar') ||
          v.name.toLowerCase().includes('kavya')
      );
      if (tamilVoice) {
        utterance.voice = tamilVoice;
      }
      utterance.lang = 'ta-IN';
    } else {
      // Find warmer human-like voice (Natural, Samantha, Karen, Google UK/US/IN)
      const warmVoice =
        voices.find(
          (v) =>
            v.name.includes('Natural') ||
            v.name.includes('Google UK English Female') ||
            v.name.includes('Samantha') ||
            v.name.includes('Karen') ||
            v.lang === 'en-IN'
        ) || voices.find((v) => v.lang.startsWith('en'));

      if (warmVoice) {
        utterance.voice = warmVoice;
      }
      utterance.lang = 'en-US';
    }

    window.speechSynthesis.speak(utterance);
  }
}

export const soundCtrl = new SoundController();
