export type SoundType =
  | 'gamma_40hz'
  | 'alpha_10hz'
  | 'rain'
  | 'brown_noise'
  | 'coffee_shop';

const SRC_MAP: Record<SoundType, string> = {
  gamma_40hz: '/sounds/binaural-gamma.mp3',
  alpha_10hz: '/sounds/binaural-alpha.mp3',
  rain: '/sounds/rain-ambience.mp3',
  brown_noise: '/sounds/brown-noise.mp3',
  coffee_shop: '/sounds/coffee-shop.mp3',
};

class AmbientMixer {
  private audio: HTMLAudioElement | null = null;
  private volume = 0.5;

  play(type: SoundType) {
    if (typeof window === 'undefined') return;

    this.stop();

    const src = SRC_MAP[type];
    this.audio = new Audio(src);
    this.audio.loop = true;
    this.audio.volume = this.volume;
    this.audio.play().catch(() => {
      // Otomatik oynatma engellendi; kullanıcı etkileşimi gerekir
    });
  }

  setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.audio) this.audio.volume = this.volume;
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
  }
}

export const ambientMixer = new AmbientMixer();
