export interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  progress: number; // 0–100
}

export class NeuralVoice {
  private utterance: SpeechSynthesisUtterance | null = null;
  private synth: SpeechSynthesis | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
    }
  }

  speak(text: string, speed = 1.0, onEnd?: () => void) {
    if (!this.synth) return;
    if (this.synth.speaking) this.synth.cancel();

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.lang = 'tr-TR';
    this.utterance.rate = Math.max(0.5, Math.min(2, speed));
    this.utterance.pitch = 1;

    this.utterance.onend = () => {
      this.utterance = null;
      onEnd?.();
    };

    this.synth.speak(this.utterance);
  }

  pause() {
    this.synth?.pause();
  }

  resume() {
    this.synth?.resume();
  }

  cancel() {
    this.synth?.cancel();
    this.utterance = null;
  }
}

export const voiceEngine = new NeuralVoice();
