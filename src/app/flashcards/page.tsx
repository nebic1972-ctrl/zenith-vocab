'use client'

import { useState, useEffect, useCallback } from 'react'
import AddWordModal from '@/components/AddWordModal'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { soundManager } from '@/lib/soundManager'
import { haptics } from '@/lib/haptics'
import { exportVocabularyCSV, exportToJSON } from '@/lib/exportManager'
import { SpacedRepetitionSystem, ReviewCard, ReviewQuality } from '@/lib/spacedRepetition'
import toast from 'react-hot-toast'
import SettingsPanel from '@/components/SettingsPanel'
import {
  getCollectionFlashcardWords,
  getCollectionWithWords,
  updateCollectionProgress
} from '@/lib/collectionsService'
import {
  startFlashcardSession,
  endFlashcardSession,
  recordWordReview,
  updateWordMastery
} from '@/lib/flashcardService'
import type { VocabularyWord, Collection } from '@/types/collection'

// Safe sound functions
const playSuccess = () => {
  try {
    soundManager.playSuccess()
  } catch (error) {
    console.error('Sound error:', error)
  }
}

const playError = () => {
  try {
    soundManager.playError()
  } catch (error) {
    console.error('Sound error:', error)
  }
}

const playFlip = () => {
  try {
    soundManager.playFlip()
  } catch (error) {
    console.error('Sound error:', error)
  }
}

const playTap = () => {
  try {
    soundManager.playTap()
  } catch (error) {
    console.error('Sound error:', error)
  }
}

// Safe haptic functions
const hapticLight = () => {
  try {
    haptics.light()
  } catch (error) {
    console.error('Haptic error:', error)
  }
}

const hapticMedium = () => {
  try {
    haptics.medium()
  } catch (error) {
    console.error('Haptic error:', error)
  }
}

const hapticSuccess = () => {
  try {
    haptics.success()
  } catch (error) {
    console.error('Haptic error:', error)
  }
}

const hapticError = () => {
  try {
    haptics.error()
  } catch (error) {
    console.error('Haptic error:', error)
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function FlashcardsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const collectionId = searchParams.get('collection')

  const [words, setWords] = useState<VocabularyWord[]>([])
  const [filteredWords, setFilteredWords] = useState<VocabularyWord[]>([])
  const [reviewCards, setReviewCards] = useState<ReviewCard[]>([])
  const [collection, setCollection] = useState<Collection | null>(null)
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    wrong: 0,
    skipped: 0
  })
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<number>(0)
  const [cardStartTime, setCardStartTime] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Fetch words - refreshTrigger veya collectionId değişince yeniden yükle
  useEffect(() => {
    const loadWords = async () => {
      if (!user) return

      try {
        setLoading(true)

        if (collectionId) {
          // Koleksiyon modu: koleksiyondan kelimeleri al
          const [collectionData, wordsData] = await Promise.all([
            getCollectionWithWords(collectionId),
            getCollectionFlashcardWords(collectionId)
          ])
          setCollection(collectionData)
          const shuffled = shuffleArray(wordsData)
          setWords(shuffled)
          setFilteredWords(shuffled)
          setReviewCards(shuffled.map(w => SpacedRepetitionSystem.createNewCard(w.id)))
        } else {
          // Normal mod: tüm kelimeler
          const supabase = createClient()
          const { data, error } = await supabase
            .from('vocabulary_words')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (error) throw error

          setCollection(null)
          setWords(data || [])
          setFilteredWords(data || [])

          if (data) {
            setReviewCards(data.map(w =>
              SpacedRepetitionSystem.createNewCard(w.id)
            ))
          }
        }
      } catch (error) {
        console.error('Error fetching words:', error)
        toast.error('Kelimeler yüklenemedi')
      } finally {
        setLoading(false)
      }
    }

    loadWords()
  }, [user, refreshTrigger, collectionId])

  // Session başlat (koleksiyon modunda flashcard başladığında)
  useEffect(() => {
    if (
      collectionId &&
      filteredWords.length > 0 &&
      !sessionId &&
      user
    ) {
      const startSession = async () => {
        try {
          const id = await startFlashcardSession(user.id, collectionId)
          setSessionId(id)
          setSessionStartTime(Date.now())
          setCardStartTime(Date.now())
        } catch (error) {
          console.error('Error starting session:', error)
        }
      }
      startSession()
    }
  }, [collectionId, filteredWords.length, sessionId, user])

  // Apply filters
  useEffect(() => {
    let filtered = words

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(w => 
        selectedCategories.includes(w.category || 'daily')
      )
    }

    if (selectedLevels.length > 0) {
      filtered = filtered.filter(w => 
        selectedLevels.includes(w.level || 'B1')
      )
    }

    setFilteredWords(filtered)
    setCurrentIndex(0)
    setIsFlipped(false)
  }, [selectedCategories, selectedLevels, words])

  // Calculate counts
  const categoryCounts = words.reduce((acc, word) => {
    const cat = word.category || 'daily'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const levelCounts = words.reduce((acc, word) => {
    const lvl = word.level || 'B1'
    acc[lvl] = (acc[lvl] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Toggle functions
  const toggleCategory = (cat: string) => {
    playTap()
    hapticLight()
    setSelectedCategories(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    )
  }

  const toggleLevel = (lvl: string) => {
    playTap()
    hapticLight()
    setSelectedLevels(prev =>
      prev.includes(lvl)
        ? prev.filter(l => l !== lvl)
        : [...prev, lvl]
    )
  }

  // Navigation
  const handleNext = useCallback(() => {
    if (currentIndex < filteredWords.length - 1) {
      playTap()
      hapticLight()
      setCurrentIndex(prev => prev + 1)
      setIsFlipped(false)
    }
  }, [currentIndex, filteredWords.length])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      playTap()
      hapticLight()
      setCurrentIndex(prev => prev - 1)
      setIsFlipped(false)
    }
  }, [currentIndex])

  const handleFlip = useCallback(() => {
    playFlip()
    hapticMedium()
    setIsFlipped(prev => !prev)
  }, [])

  // Koleksiyon modu: Biliyorum/Bilmiyorum
  const handleAnswer = async (correct: boolean) => {
    if (!user) return

    const currentWord = filteredWords[currentIndex] as VocabularyWord
    const result = correct ? 'correct' as const : 'wrong' as const
    const responseTime = Date.now() - cardStartTime
    const previousMastery = currentWord.mastery_level ?? 0

    try {
      const newMastery = await updateWordMastery(
        currentWord.id,
        result,
        previousMastery,
        (currentWord as VocabularyWord).review_count ?? 0
      )

      if (sessionId) {
        await recordWordReview(
          user.id,
          currentWord.id,
          sessionId,
          result,
          previousMastery,
          newMastery,
          responseTime
        )
      }

      setSessionStats(prev => ({
        ...prev,
        correct: prev.correct + (correct ? 1 : 0),
        wrong: prev.wrong + (correct ? 0 : 1)
      }))

      if (currentIndex < filteredWords.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setIsFlipped(false)
        setCardStartTime(Date.now())
      } else {
        await finishSession({
          correct: sessionStats.correct + (correct ? 1 : 0),
          wrong: sessionStats.wrong + (correct ? 0 : 1),
          skipped: sessionStats.skipped
        })
      }
    } catch (error) {
      console.error('Error handling answer:', error)
      toast.error('Cevap kaydedilemedi')
    }
  }

  const finishSession = async (finalStats?: { correct: number; wrong: number; skipped: number }) => {
    const stats = finalStats ?? sessionStats

    if (collectionId) {
      await updateCollectionProgress(collectionId)
    }

    if (sessionId) {
      const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000)
      try {
        await endFlashcardSession(sessionId, {
          totalCards: filteredWords.length,
          correctAnswers: stats.correct,
          wrongAnswers: stats.wrong,
          skippedCards: stats.skipped,
          durationSeconds
        })
      } catch (error) {
        console.error('Error ending session:', error)
      }
    }

    toast.success('🎉 Tebrikler! Tüm kelimeleri tamamladınız!')
    setTimeout(() => {
      router.push('/statistics')
    }, 2000)
  }

  const handleSkip = async () => {
    if (!user) return

    const currentWord = filteredWords[currentIndex] as VocabularyWord

    try {
      if (sessionId) {
        await recordWordReview(
          user.id,
          currentWord.id,
          sessionId,
          'skipped',
          currentWord.mastery_level ?? 0,
          currentWord.mastery_level ?? 0,
          null
        )
      }

      setSessionStats(prev => ({ ...prev, skipped: prev.skipped + 1 }))

      if (currentIndex < filteredWords.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setIsFlipped(false)
        setCardStartTime(Date.now())
      } else {
        await finishSession({
          correct: sessionStats.correct,
          wrong: sessionStats.wrong,
          skipped: sessionStats.skipped + 1
        })
      }
    } catch (error) {
      console.error('Error skipping card:', error)
    }
  }

  const handleRestart = () => {
    setFilteredWords(shuffleArray([...filteredWords]))
    setCurrentIndex(0)
    setIsFlipped(false)
    setSessionStats({ correct: 0, wrong: 0, skipped: 0 })
    setSessionId(null)
  }

  // Review quality (normal mod - 1-5)
  const handleReview = async (quality: ReviewQuality) => {
    const currentWord = filteredWords[currentIndex]
    const currentCard = reviewCards.find(c => c.word_id === currentWord.id)
    
    if (!currentCard) return

    const updatedCard = SpacedRepetitionSystem.calculateNextReview(currentCard, quality)
    
    setReviewCards(prev => 
      prev.map(c => c.word_id === currentWord.id ? updatedCard : c)
    )

    // Feedback
    if (quality >= 3) {
      playSuccess()
      hapticSuccess()
      toast.success('Harika! Kelimeyi biliyorsun 🎉')
    } else {
      playError()
      hapticError()
      toast.error('Tekrar etmen gerekiyor 📚')
    }

    // Move to next
    setTimeout(() => {
      if (currentIndex < filteredWords.length - 1) {
        handleNext()
      }
    }, 500)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === ' ') {
        e.preventDefault()
        handleFlip()
      }
      if (e.key === '1') handleReview(1)
      if (e.key === '2') handleReview(2)
      if (e.key === '3') handleReview(3)
      if (e.key === '4') handleReview(4)
      if (e.key === '5') handleReview(5)
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex, filteredWords.length, handleNext, handlePrevious, handleFlip])

  // Export functions (sadece normal modda - sidebar'da)
  const handleExportCSV = () => {
    exportVocabularyCSV(filteredWords as Parameters<typeof exportVocabularyCSV>[0])
    toast.success('CSV dosyası indirildi!')
  }

  const handleExportJSON = () => {
    exportToJSON(filteredWords, 'vocabulary')
    toast.success('JSON dosyası indirildi!')
  }

  const currentWord = filteredWords[currentIndex]
  const dueCards = SpacedRepetitionSystem.getDueCards(reviewCards)
  const isCollectionMode = !!collectionId

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-400">Kelimeler yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Koleksiyon modu: kelime yok
  if (isCollectionMode && filteredWords.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {collection ? `${collection.name} koleksiyonunda kelime yok` : 'Henüz kelime eklemediniz'}
          </h2>
          <p className="text-gray-400 mb-6">
            {collection ? 'Bu koleksiyona kelime ekleyerek başlayın' : 'İlk kelimenizi ekleyerek başlayın'}
          </p>
          <button
            onClick={() => router.push(collection ? `/collections/${collection.id}` : '/dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            {collection ? 'Koleksiyona Dön' : "Dashboard'a Git"}
          </button>
        </div>
      </div>
    )
  }

  // Koleksiyon modu: basit flashcard UI (Biliyorum/Bilmiyorum)
  if (isCollectionMode && currentWord) {
    const progress = ((currentIndex + 1) / filteredWords.length) * 100
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white">🎴 Flashcard Çalışması</h1>
                {collection && (
                  <p className="text-gray-400 mt-1">
                    {collection.icon} {collection.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => router.push(`/collections/${collectionId}`)}
                className="text-gray-400 hover:text-white"
              >
                ✕ Çık
              </button>
            </div>

            <div className="bg-gray-800 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>{currentIndex + 1} / {filteredWords.length}</span>
              <span>%{Math.round(progress)}</span>
            </div>
          </div>

          {/* Session Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-800">
              <div className="text-2xl font-bold text-green-400">{sessionStats.correct}</div>
              <div className="text-sm text-gray-500">Doğru</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-800">
              <div className="text-2xl font-bold text-red-400">{sessionStats.wrong}</div>
              <div className="text-sm text-gray-500">Yanlış</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-800">
              <div className="text-2xl font-bold text-blue-400">{sessionStats.skipped}</div>
              <div className="text-sm text-gray-500">Atlanan</div>
            </div>
          </div>

          {/* Flashcard */}
          <div className="perspective-1000 mb-8">
            <motion.div
              className="relative w-full h-96 cursor-pointer"
              onClick={handleFlip}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring' }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div
                className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center p-8"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                <div className="text-center text-white">
                  <div className="text-5xl font-bold mb-4">{currentWord.word}</div>
                  <div className="text-xl opacity-80">{currentWord.category || 'daily'}</div>
                  <div className="mt-8 text-sm opacity-60">Kartı çevirmek için tıklayın</div>
                </div>
              </div>
              <div
                className="absolute inset-0 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-2xl flex items-center justify-center p-8"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <div className="text-center text-white">
                  <div className="text-4xl font-bold mb-4">{currentWord.translation}</div>
                  {currentWord.definition && (
                    <div className="text-lg opacity-90 mb-4">{currentWord.definition}</div>
                  )}
                  {currentWord.example_sentence && (
                    <div className="text-sm opacity-75 italic">&quot;{currentWord.example_sentence}&quot;</div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            {isFlipped ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAnswer(false)}
                  className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-lg shadow-lg"
                >
                  ❌ Bilmiyorum
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAnswer(true)}
                  className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-lg shadow-lg"
                >
                  ✅ Biliyorum
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSkip}
                  className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold text-lg shadow-lg"
                >
                  ⏭️ Atla
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFlip}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg"
                >
                  🔄 Çevir
                </motion.button>
              </>
            )}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleRestart}
              className="text-gray-500 hover:text-white font-medium"
            >
              🔄 Yeniden Başlat
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Settings Panel */}
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Filter Sidebar */}
      <aside className="w-80 bg-gray-900 border-r border-gray-800 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            🎯 Filtreler
          </h3>
          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            ⚙️
          </button>
        </div>

        {/* Due Cards Alert */}
        {dueCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg"
          >
            <p className="text-orange-300 text-sm font-medium">
              🔔 {dueCards.length} kelime tekrar bekliyor!
            </p>
          </motion.div>
        )}

        {/* Categories */}
        <div className="mb-8">
          <h4 className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-wide">
            Kategoriler
          </h4>
          <div className="space-y-2">
            {[
              { id: 'business', label: 'İş İngilizcesi', icon: '💼' },
              { id: 'academic', label: 'Akademik', icon: '🎓' },
              { id: 'daily', label: 'Günlük Konuşma', icon: '💬' },
              { id: 'technical', label: 'Teknik', icon: '⚙️' },
              { id: 'legal', label: 'Hukuk', icon: '⚖️' },
              { id: 'medical', label: 'Tıp', icon: '🏥' },
              { id: 'travel', label: 'Seyahat', icon: '✈️' },
            ].map(cat => (
              <motion.label
                key={cat.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  selectedCategories.includes(cat.id)
                    ? 'bg-blue-600/20 border border-blue-500'
                    : 'bg-gray-800 hover:bg-gray-750 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">{cat.icon}</span>
                  <span className="text-gray-300 text-sm font-medium">{cat.label}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  categoryCounts[cat.id] > 0 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-gray-700 text-gray-500'
                }`}>
                  {categoryCounts[cat.id] || 0}
                </span>
              </motion.label>
            ))}
          </div>
        </div>

        {/* Levels */}
        <div className="mb-8">
          <h4 className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-wide">
            Seviye
          </h4>
          <div className="space-y-2">
            {[
              { id: 'A1', label: 'A1 - Başlangıç' },
              { id: 'A2', label: 'A2 - Temel' },
              { id: 'B1', label: 'B1 - Orta' },
              { id: 'B2', label: 'B2 - Orta Üstü' },
              { id: 'C1', label: 'C1 - İleri' },
              { id: 'C2', label: 'C2 - Uzman' },
            ].map(lvl => (
              <motion.label
                key={lvl.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  selectedLevels.includes(lvl.id)
                    ? 'bg-blue-600/20 border border-blue-500'
                    : 'bg-gray-800 hover:bg-gray-750 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedLevels.includes(lvl.id)}
                    onChange={() => toggleLevel(lvl.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-300 text-sm font-medium">{lvl.label}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  levelCounts[lvl.id] > 0 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-gray-700 text-gray-500'
                }`}>
                  {levelCounts[lvl.id] || 0}
                </span>
              </motion.label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => {
              setShowAddModal(true)
              playTap()
              hapticLight()
            }}
            className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all text-sm font-medium"
          >
            ➕ Yeni Kelime Ekle
          </button>
          {(selectedCategories.length > 0 || selectedLevels.length > 0) && (
            <button
              onClick={() => {
                setSelectedCategories([])
                setSelectedLevels([])
                playTap()
                hapticLight()
              }}
              className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-all text-sm font-medium"
            >
              🔄 Filtreleri Temizle
            </button>
          )}
          
          <button
            onClick={handleExportCSV}
            className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-all text-sm font-medium"
          >
            📥 CSV İndir
          </button>
          
          <button
            onClick={handleExportJSON}
            className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-all text-sm font-medium"
          >
            📥 JSON İndir
          </button>
        </div>

        {/* Stats */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-2">Toplam Kelime</div>
          <div className="text-2xl font-bold text-white">{words.length}</div>
          {filteredWords.length !== words.length && (
            <div className="text-xs text-blue-400 mt-1">
              {filteredWords.length} gösteriliyor
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              📚 Flashcards
            </h1>
            <p className="text-gray-400">
              {filteredWords.length} kelime gösteriliyor
              {filteredWords.length > 0 && (
                <span className="text-gray-600 ml-2">
                  • Klavye: ← → (gezinti), Boşluk (çevir), 1-5 (değerlendir)
                </span>
              )}
            </p>
          </div>

          {filteredWords.length === 0 ? (
            <div className="empty-state flex-1 flex flex-col items-center justify-center">
              <div className="empty-state-icon">📭</div>
              <h3 className="empty-state-title">Kelime bulunamadı</h3>
              <p className="empty-state-description">
                Filtrelerinizi değiştirin veya yeni kelime ekleyin
              </p>
              <button
                onClick={() => {
                  setShowAddModal(true)
                  playTap()
                  hapticLight()
                }}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all"
              >
                ➕ Yeni Kelime Ekle
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              {/* Flashcard */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleFlip}
                  className="relative w-full h-96 cursor-pointer mb-8"
                  style={{ perspective: '1000px' }}
                >
                  <motion.div
                    className="relative w-full h-full"
                    style={{
                      transformStyle: 'preserve-3d',
                    }}
                    animate={{
                      rotateY: isFlipped ? 180 : 0
                    }}
                    transition={{ duration: 0.6, type: 'spring' }}
                  >
                    {/* Front */}
                    <div
                      className="absolute w-full h-full"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 relative">
                        {/* Category & Level badges - top right */}
                        <div className="absolute top-4 right-4 flex gap-2">
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
                            {currentWord.category || 'daily'}
                          </span>
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                            {currentWord.level || 'B1'}
                          </span>
                        </div>
                        <h2 className="text-6xl font-bold text-white mb-4">
                          {currentWord.word}
                        </h2>
                        {currentWord.pronunciation_us && (
                          <p className="text-blue-200 text-xl">
                            /{currentWord.pronunciation_us}/
                          </p>
                        )}
                        <p className="text-blue-200 text-sm mt-8 opacity-75">
                          Kartı çevirmek için tıklayın veya Boşluk tuşuna basın
                        </p>
                      </div>
                    </div>

                    {/* Back */}
                    <div
                      className="absolute w-full h-full"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 overflow-y-auto">
                        <h3 className="text-4xl font-bold text-white mb-6">
                          {currentWord.translation}
                        </h3>
                        {currentWord.definition && (
                          <p className="text-purple-100 text-center max-w-lg mb-4 text-lg">
                            {currentWord.definition}
                          </p>
                        )}
                        {currentWord.pronunciation_us && (
                          <div className="mt-4 pt-4 border-t border-purple-400/30 w-full max-w-lg">
                            <p className="text-sm text-purple-200 mb-2">🇺🇸 US:</p>
                            <p className="text-lg font-mono text-white">
                              /{currentWord.pronunciation_us}/
                            </p>
                          </div>
                        )}
                        {currentWord.pronunciation_uk && (
                          <div className="mt-2 w-full max-w-lg">
                            <p className="text-sm text-purple-200 mb-2">🇬🇧 UK:</p>
                            <p className="text-lg font-mono text-white">
                              /{currentWord.pronunciation_uk}/
                            </p>
                          </div>
                        )}
                        {currentWord.example_sentence && (
                          <p className="text-purple-200 text-sm text-center italic max-w-lg mt-4 px-6 py-3 bg-purple-700/30 rounded-lg">
                            &quot;{currentWord.example_sentence}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-center gap-6 mb-6">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="flashcard-nav-btn"
                  aria-label="Önceki kelime"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={2.5} 
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M15.75 19.5L8.25 12l7.5-7.5" 
                    />
                  </svg>
                </motion.button>

                <div className="text-center min-w-[120px]">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-bold text-white">
                      {currentIndex + 1}
                    </span>
                    <span className="text-gray-500 text-xl">/</span>
                    <span className="text-2xl text-gray-400">
                      {filteredWords.length}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {Math.round(((currentIndex + 1) / filteredWords.length) * 100)}% tamamlandı
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleNext}
                  disabled={currentIndex === filteredWords.length - 1}
                  className="flashcard-nav-btn"
                  aria-label="Sonraki kelime"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={2.5} 
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M8.25 4.5l7.5 7.5-7.5 7.5" 
                    />
                  </svg>
                </motion.button>
              </div>

              {/* Review Buttons */}
              <div className="flex items-center justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReview(1)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  1️⃣ Hiç
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReview(2)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  2️⃣ Zor
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReview(3)}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  3️⃣ Orta
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReview(4)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  4️⃣ İyi
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReview(5)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  5️⃣ Mükemmel
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Word Modal */}
      <AddWordModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onWordAdded={() => {
          console.log('🔄 Refreshing flashcards...')
          setRefreshTrigger(prev => prev + 1)
        }}
      />
    </div>
  )
}
