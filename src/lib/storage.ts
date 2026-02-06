export interface StoredWord {
  id: string
  word: string
  translation: string
  phonetic?: string
  example?: string
  category: string
  level: string
  progress: number
  isFavorite: boolean
  createdAt: number
  lastReviewed?: number
  reviewCount: number
  correctCount: number
  incorrectCount: number
}

export interface UserSettings {
  name: string
  email: string
  theme: string
  language: string
  dailyReminder: boolean
  reminderTime: string
  progressNotifications: boolean
  emailNotifications: boolean
  dailyGoal: number
  autoPlay: boolean
  showPhonetic: boolean
  cardSpeed: string
  voiceEnabled: boolean
  voiceSpeed: number
  voiceGender: string
}

export interface UserStats {
  totalStudyTime: number // dakika
  streak: number
  lastStudyDate: string
  achievements: string[]
}

const STORAGE_KEYS = {
  WORDS: 'zenith_vocab_words',
  SETTINGS: 'zenith_vocab_settings',
  STATS: 'zenith_vocab_stats',
  FAVORITES: 'zenith_vocab_favorites'
}

// Words
export const getWords = (): StoredWord[] => {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEYS.WORDS)
  return data ? JSON.parse(data) : []
}

export const saveWords = (words: StoredWord[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words))
}

export const addWord = (word: Omit<StoredWord, 'id' | 'createdAt' | 'reviewCount' | 'correctCount' | 'incorrectCount'>) => {
  const words = getWords()
  const newWord: StoredWord = {
    ...word,
    id: Date.now().toString() + Math.random(),
    createdAt: Date.now(),
    reviewCount: 0,
    correctCount: 0,
    incorrectCount: 0
  }
  words.unshift(newWord)
  saveWords(words)
  return newWord
}

export const updateWord = (id: string, updates: Partial<StoredWord>) => {
  const words = getWords()
  const index = words.findIndex(w => w.id === id)
  if (index !== -1) {
    words[index] = { ...words[index], ...updates }
    saveWords(words)
  }
}

export const deleteWord = (id: string) => {
  const words = getWords().filter(w => w.id !== id)
  saveWords(words)
}

export const updateWordProgress = (id: string, isCorrect: boolean) => {
  const words = getWords()
  const word = words.find(w => w.id === id)
  if (word) {
    word.reviewCount++
    word.lastReviewed = Date.now()
    
    if (isCorrect) {
      word.correctCount++
      word.progress = Math.min(100, word.progress + 10)
    } else {
      word.incorrectCount++
      word.progress = Math.max(0, word.progress - 5)
    }
    
    saveWords(words)
  }
}

// Settings
export const getSettings = (): UserSettings => {
  if (typeof window === 'undefined') return getDefaultSettings()
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS)
  return data ? JSON.parse(data) : getDefaultSettings()
}

export const saveSettings = (settings: UserSettings) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
}

const getDefaultSettings = (): UserSettings => ({
  name: 'Kullanıcı',
  email: 'user@example.com',
  theme: 'light',
  language: 'tr',
  dailyReminder: true,
  reminderTime: '09:00',
  progressNotifications: true,
  emailNotifications: false,
  dailyGoal: 10,
  autoPlay: true,
  showPhonetic: true,
  cardSpeed: 'normal',
  voiceEnabled: true,
  voiceSpeed: 1.0,
  voiceGender: 'female'
})

// Stats
export const getStats = (): UserStats => {
  if (typeof window === 'undefined') return getDefaultStats()
  const data = localStorage.getItem(STORAGE_KEYS.STATS)
  return data ? JSON.parse(data) : getDefaultStats()
}

export const saveStats = (stats: UserStats) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats))
}

export const updateStreak = () => {
  const stats = getStats()
  const today = new Date().toDateString()
  const lastStudy = new Date(stats.lastStudyDate).toDateString()
  
  if (today !== lastStudy) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toDateString()
    
    if (lastStudy === yesterdayStr) {
      stats.streak++
    } else if (lastStudy !== today) {
      stats.streak = 1
    }
    
    stats.lastStudyDate = today
    saveStats(stats)
  }
}

export const addStudyTime = (minutes: number) => {
  const stats = getStats()
  stats.totalStudyTime += minutes
  saveStats(stats)
}

const getDefaultStats = (): UserStats => ({
  totalStudyTime: 0,
  streak: 0,
  lastStudyDate: new Date().toDateString(),
  achievements: []
})

// Export/Import
export const exportData = () => {
  const data = {
    words: getWords(),
    settings: getSettings(),
    stats: getStats(),
    exportDate: new Date().toISOString(),
    version: '1.0'
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `zenith-vocab-backup-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export const importData = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        if (data.words) saveWords(data.words)
        if (data.settings) saveSettings(data.settings)
        if (data.stats) saveStats(data.stats)
        
        resolve()
      } catch (error) {
        reject(new Error('Geçersiz dosya formatı'))
      }
    }
    
    reader.onerror = () => reject(new Error('Dosya okunamadı'))
    reader.readAsText(file)
  })
}

export const clearAllData = () => {
  if (typeof window === 'undefined') return
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}
