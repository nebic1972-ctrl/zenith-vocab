'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { soundManager } from '@/lib/soundManager'
import { haptics } from '@/lib/haptics'
import { motion, AnimatePresence } from 'framer-motion'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { theme, toggleTheme } = useTheme()
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [hapticEnabled, setHapticEnabled] = useState(true)
  const [volume, setVolume] = useState(0.5)
  const [mounted, setMounted] = useState(false)

  // Load settings after mount
  useEffect(() => {
    setMounted(true)
    
    if (typeof window !== 'undefined') {
      try {
        setSoundEnabled(!soundManager.isMuted())
        setHapticEnabled(haptics.isEnabled())
        setVolume(soundManager.getVolume())
      } catch (error) {
        console.error('Settings load error:', error)
      }
    }
  }, [])

  const handleThemeToggle = () => {
    try {
      soundManager.playTap()
      haptics.light()
    } catch (error) {
      console.error('Theme toggle error:', error)
    }
    toggleTheme()
  }

  const handleSoundToggle = () => {
    try {
      const newMuted = soundManager.toggleMute()
      setSoundEnabled(!newMuted)
      
      if (!newMuted) {
        soundManager.playTap()
      }
      
      haptics.light()
    } catch (error) {
      console.error('Sound toggle error:', error)
    }
  }

  const handleHapticToggle = () => {
    try {
      const newState = haptics.toggle()
      setHapticEnabled(newState)
      
      if (newState) {
        haptics.light()
      }
    } catch (error) {
      console.error('Haptic toggle error:', error)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const newVolume = parseFloat(e.target.value)
      setVolume(newVolume)
      soundManager.setVolume(newVolume)
      soundManager.playTap()
    } catch (error) {
      console.error('Volume change error:', error)
    }
  }

  if (!mounted) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-800 shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                ⚙️ Ayarlar
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Theme */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  🎨 Tema
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 font-medium">
                      {theme === 'dark' ? 'Karanlık Mod' : 'Aydınlık Mod'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Görünümü değiştir
                    </p>
                  </div>
                  <button
                    onClick={handleThemeToggle}
                    className={`relative w-16 h-8 rounded-full transition-colors ${
                      theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <motion.div
                      layout
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center text-xs ${
                        theme === 'dark' ? 'left-9' : 'left-1'
                      }`}
                    >
                      {theme === 'dark' ? '🌙' : '☀️'}
                    </motion.div>
                  </button>
                </div>
              </motion.div>

              {/* Sound */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  🔊 Ses Efektleri
                </h3>
                
                {/* Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-300 font-medium">
                      Ses Efektleri
                    </p>
                    <p className="text-sm text-gray-500">
                      {soundEnabled ? 'Açık' : 'Kapalı'}
                    </p>
                  </div>
                  <button
                    onClick={handleSoundToggle}
                    className={`relative w-16 h-8 rounded-full transition-colors ${
                      soundEnabled ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                  >
                    <motion.div
                      layout
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg ${
                        soundEnabled ? 'left-9' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Volume Slider */}
                {soundEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm text-gray-400 mb-2">
                      Ses Seviyesi: {Math.round(volume * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </motion.div>
                )}
              </motion.div>

              {/* Haptic */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  📳 Dokunsal Geri Bildirim
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 font-medium">
                      Titreşim
                    </p>
                    <p className="text-sm text-gray-500">
                      {hapticEnabled ? 'Açık' : 'Kapalı'} • Mobil cihazlarda
                    </p>
                  </div>
                  <button
                    onClick={handleHapticToggle}
                    className={`relative w-16 h-8 rounded-full transition-colors ${
                      hapticEnabled ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                  >
                    <motion.div
                      layout
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg ${
                        hapticEnabled ? 'left-9' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </motion.div>

              {/* Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
              >
                <p className="text-sm text-blue-300">
                  💡 <strong>İpucu:</strong> Ayarlarınız otomatik olarak kaydedilir ve tüm cihazlarınızda senkronize olur.
                </p>
              </motion.div>

              {/* Version */}
              <div className="text-center pt-4 border-t border-gray-800">
                <p className="text-sm text-gray-500">
                  Zenith Vocab v1.0.0
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Made with ❤️ by Zenith Team
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
