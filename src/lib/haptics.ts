class HapticManager {
  private enabled: boolean = true

  constructor() {
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('hapticEnabled') !== 'false'
    }
  }

  // Hafif titreşim (buton tıklama)
  light() {
    if (!this.enabled || !('vibrate' in navigator)) return
    navigator.vibrate(10)
  }

  // Orta titreşim (kart çevirme)
  medium() {
    if (!this.enabled || !('vibrate' in navigator)) return
    navigator.vibrate(20)
  }

  // Güçlü titreşim (önemli işlem)
  heavy() {
    if (!this.enabled || !('vibrate' in navigator)) return
    navigator.vibrate(30)
  }

  // Başarı pattern
  success() {
    if (!this.enabled || !('vibrate' in navigator)) return
    navigator.vibrate([10, 50, 10])
  }

  // Hata pattern
  error() {
    if (!this.enabled || !('vibrate' in navigator)) return
    navigator.vibrate([20, 50, 20, 50, 20])
  }

  // Seçim pattern
  selection() {
    if (!this.enabled || !('vibrate' in navigator)) return
    navigator.vibrate([5, 30, 5])
  }

  // Toggle on/off
  toggle() {
    this.enabled = !this.enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('hapticEnabled', String(this.enabled))
    }
    return this.enabled
  }

  // Get status
  isEnabled() {
    return this.enabled
  }

  // Set status
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('hapticEnabled', String(enabled))
    }
  }
}

export const haptics = new HapticManager()

// Named exports
export const {
  light: hapticLight,
  medium: hapticMedium,
  heavy: hapticHeavy,
  success: hapticSuccess,
  error: hapticError,
  selection: hapticSelection,
} = haptics
