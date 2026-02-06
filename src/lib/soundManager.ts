import { Howl } from 'howler'

class SoundManager {
  private sounds: Map<string, Howl> = new Map()
  private muted: boolean = false
  private volume: number = 0.5

  constructor() {
    // LocalStorage'dan ayarları oku
    if (typeof window !== 'undefined') {
      const storedMuted = localStorage.getItem('soundMuted')
      const storedVolume = localStorage.getItem('soundVolume')
      
      this.muted = storedMuted === 'true'
      this.volume = storedVolume ? parseFloat(storedVolume) : 0.5
      
      // Ses dosyalarını yükle
      this.loadSounds()
    }
  }

  private loadSounds() {
    // Success sound
    this.sounds.set('success', new Howl({
      src: ['/sounds/success.mp3'],
      volume: this.volume,
      preload: true,
      html5: true
    }))

    // Error sound
    this.sounds.set('error', new Howl({
      src: ['/sounds/error.mp3'],
      volume: this.volume,
      preload: true,
      html5: true
    }))

    // Tap/Click sound
    this.sounds.set('tap', new Howl({
      src: ['/sounds/tap.mp3'],
      volume: this.volume * 0.7, // Daha sessiz
      preload: true,
      html5: true
    }))

    // Flip sound
    this.sounds.set('flip', new Howl({
      src: ['/sounds/flip.mp3'],
      volume: this.volume,
      preload: true,
      html5: true
    }))
  }

  private play(soundName: string) {
    if (this.muted) return
    
    const sound = this.sounds.get(soundName)
    if (sound) {
      sound.volume(this.volume)
      sound.play()
    }
  }

  // Public methods
  playSuccess() {
    this.play('success')
  }

  playError() {
    this.play('error')
  }

  playTap() {
    this.play('tap')
  }

  playFlip() {
    this.play('flip')
  }

  playCustom(url: string) {
    if (this.muted) return
    
    const customSound = new Howl({
      src: [url],
      volume: this.volume,
      html5: true
    })
    customSound.play()
  }

  // Getters
  isMuted(): boolean {
    return this.muted
  }

  getVolume(): number {
    return this.volume
  }

  // Setters
  setMuted(muted: boolean) {
    this.muted = muted
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundMuted', String(muted))
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    
    // Update all sounds
    this.sounds.forEach(sound => {
      sound.volume(this.volume)
    })
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundVolume', String(this.volume))
    }
  }

  // Toggle
  toggleMute(): boolean {
    this.muted = !this.muted
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundMuted', String(this.muted))
    }
    return this.muted
  }
}

// Singleton instance
export const soundManager = new SoundManager()

// Named exports for convenience
export const playSuccess = () => soundManager.playSuccess()
export const playError = () => soundManager.playError()
export const playTap = () => soundManager.playTap()
export const playFlip = () => soundManager.playFlip()
export const playCustom = (url: string) => soundManager.playCustom(url)
export const setMuted = (muted: boolean) => soundManager.setMuted(muted)
export const setVolume = (volume: number) => soundManager.setVolume(volume)
