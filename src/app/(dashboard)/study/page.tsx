'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  getDueWords,
  reviewWord,
  type DueWord
} from '@/lib/spacedRepetitionService'

export default function StudyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  
  const [words, setWords] = useState<DueWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    reviewed: 0,
    correct: 0
  })

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadDueWords()
    }
  }, [user])

  const checkUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }
    
    setUser(user)
  }

  const loadDueWords = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const collectionId = searchParams.get('collection')
      const dueWords = await getDueWords(user.id, collectionId, 20)
      
      if (dueWords.length === 0) {
        toast.success('🎉 Tebrikler! Bugün için tekrar edilecek kelime yok.')
        router.push('/vocabulary')
        return
      }
      
      setWords(dueWords)
      setSessionStats({ total: dueWords.length, reviewed: 0, correct: 0 })
    } catch (error) {
      console.error('Error loading due words:', error)
      toast.error('Kelimeler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleQualityRating = async (quality: number) => {
    if (!user) return
    
    const currentWord = words[currentIndex]
    
    try {
      const result = await reviewWord(currentWord.id, quality, user.id)
      
      setSessionStats(prev => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        correct: prev.correct + (quality >= 3 ? 1 : 0)
      }))
      
      // Show next review info
      const nextReviewDays = result.review_interval
      let message = ''
      if (quality < 3) {
        message = 'Bu kelimeyi yakında tekrar göreceksin'
      } else if (nextReviewDays === 1) {
        message = 'Yarın tekrar göreceksin'
      } else if (nextReviewDays < 7) {
        message = `${nextReviewDays} gün sonra tekrar göreceksin`
      } else if (nextReviewDays < 30) {
        message = `${Math.floor(nextReviewDays / 7)} hafta sonra tekrar göreceksin`
      } else {
        message = `${Math.floor(nextReviewDays / 30)} ay sonra tekrar göreceksin`
      }
      
      toast.success(message)
      
      // Next word
      if (currentIndex < words.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setShowAnswer(false)
      } else {
        // Session completed
        const accuracy = Math.round((sessionStats.correct + (quality >= 3 ? 1 : 0)) / words.length * 100)
        toast.success(`🎉 Çalışma tamamlandı! Doğruluk: %${accuracy}`)
        router.push('/statistics')
      }
    } catch (error) {
      console.error('Error reviewing word:', error)
      toast.error('Cevap kaydedilemedi')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Kelimeler yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (words.length === 0) {
    return null
  }

  const currentWord = words[currentIndex]
  const progress = ((currentIndex + 1) / words.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            ← Geri
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🧠 Akıllı Çalışma
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Spaced Repetition ile optimal öğrenme
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {currentIndex + 1} / {words.length}
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {sessionStats.correct} doğru • {sessionStats.reviewed - sessionStats.correct} yanlış
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, rotateY: -90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: 90 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 min-h-[500px] flex flex-col"
          >
            {/* Word */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-center mb-8">
                <h2 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
                  {currentWord.word}
                </h2>
                <div className="flex items-center justify-center gap-3">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full">
                    {currentWord.level}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-full">
                    {currentWord.category}
                  </span>
                </div>
              </div>

              {/* Answer */}
              <AnimatePresence>
                {showAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full text-center space-y-4"
                  >
                    <div className="text-3xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      {currentWord.translation}
                    </div>
                    {currentWord.definition && (
                      <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                        {currentWord.definition}
                      </p>
                    )}
                    {currentWord.example_sentence && (
                      <p className="text-base text-gray-500 dark:text-gray-500 italic">
                        "{currentWord.example_sentence}"
                      </p>
                    )}
                    
                    {/* Stats */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-500">
                        <div>
                          <span className="font-medium">Tekrar:</span> {currentWord.repetitions} kez
                        </div>
                        <div>
                          <span className="font-medium">Zorluk:</span> {currentWord.easiness_factor.toFixed(2)}
                        </div>
                        {currentWord.review_interval > 0 && (
                          <div>
                            <span className="font-medium">Aralık:</span> {currentWord.review_interval} gün
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="mt-8">
              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
                >
                  Cevabı Göster
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
                    Bu kelimeyi ne kadar iyi hatırladınız?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleQualityRating(0)}
                      className="px-4 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg font-medium transition-all hover:scale-105"
                    >
                      <div className="text-2xl mb-1">😰</div>
                      <div className="text-xs">Hiç Hatırlamadım</div>
                    </button>
                    <button
                      onClick={() => handleQualityRating(1)}
                      className="px-4 py-3 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-lg font-medium transition-all hover:scale-105"
                    >
                      <div className="text-2xl mb-1">😕</div>
                      <div className="text-xs">Zor Hatırladım</div>
                    </button>
                    <button
                      onClick={() => handleQualityRating(3)}
                      className="px-4 py-3 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 rounded-lg font-medium transition-all hover:scale-105"
                    >
                      <div className="text-2xl mb-1">🤔</div>
                      <div className="text-xs">Biraz Zorlandım</div>
                    </button>
                    <button
                      onClick={() => handleQualityRating(4)}
                      className="px-4 py-3 bg-lime-100 hover:bg-lime-200 dark:bg-lime-900/30 dark:hover:bg-lime-900/50 text-lime-700 dark:text-lime-300 rounded-lg font-medium transition-all hover:scale-105"
                    >
                      <div className="text-2xl mb-1">😊</div>
                      <div className="text-xs">İyi Hatırladım</div>
                    </button>
                    <button
                      onClick={() => handleQualityRating(5)}
                      className="px-4 py-3 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg font-medium transition-all hover:scale-105 col-span-2"
                    >
                      <div className="text-2xl mb-1">🎉</div>
                      <div className="text-xs">Çok Kolay Hatırladım</div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
