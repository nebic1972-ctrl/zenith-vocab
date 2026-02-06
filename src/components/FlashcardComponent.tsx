'use client'

import { useState } from 'react'
import { RotateCcw, ChevronLeft, ChevronRight, Volume2, Check, X } from 'lucide-react'

interface Word {
  id: string
  word: string
  translation: string
  phonetic?: string
  example?: string
  category: string
  level: string
}

interface FlashcardComponentProps {
  words: Word[]
  onWordReview?: (wordId: string, isCorrect: boolean) => void
}

export default function FlashcardComponent({ words, onWordReview }: FlashcardComponentProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [knownWords, setKnownWords] = useState<string[]>([])
  const [unknownWords, setUnknownWords] = useState<string[]>([])

  const currentWord = words[currentIndex]
  const progress = ((currentIndex + 1) / words.length) * 100

  const handleFlip = () => setIsFlipped(!isFlipped)

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleKnown = () => {
    if (!knownWords.includes(currentWord.id)) {
      setKnownWords([...knownWords, currentWord.id])
    }
    onWordReview?.(currentWord.id, true) // ✅ İlerlemeyi kaydet
    handleNext()
  }

  const handleUnknown = () => {
    if (!unknownWords.includes(currentWord.id)) {
      setUnknownWords([...unknownWords, currentWord.id])
    }
    onWordReview?.(currentWord.id, false) // ❌ İlerlemeyi kaydet
    handleNext()
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setKnownWords([])
    setUnknownWords([])
  }

  const speakWord = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentWord.word)
      utterance.lang = 'en-US'
      window.speechSynthesis.speak(utterance)
    }
  }

  if (words.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Filtrelerinize uygun kelime bulunamadı.</p>
      </div>
    )
  }

  // Tamamlandı ekranı
  if (currentIndex >= words.length) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-12 rounded-2xl shadow-xl mb-6">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold mb-2">Tebrikler!</h2>
          <p className="text-lg opacity-90">Tüm kelimeleri tamamladınız</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border border-stone-200">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-2xl font-bold text-green-600">{knownWords.length}</p>
            <p className="text-sm text-slate-600">Bilinen</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-stone-200">
            <div className="text-3xl mb-2">📚</div>
            <p className="text-2xl font-bold text-amber-600">{unknownWords.length}</p>
            <p className="text-sm text-slate-600">Tekrar Edilecek</p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
        >
          <RotateCcw size={20} />
          Baştan Başla
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">
            {currentIndex + 1} / {words.length}
          </span>
          <span className="text-sm text-slate-600">%{Math.round(progress)} tamamlandı</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div 
        className="relative h-96 cursor-pointer mb-6 perspective-1000"
        onClick={handleFlip}
      >
        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Ön Yüz */}
          <div className="absolute w-full h-full backface-hidden">
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center text-white">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full">{currentWord.level}</span>
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full">{currentWord.category}</span>
              </div>
              <h2 className="text-5xl font-bold mb-4">{currentWord.word}</h2>
              {currentWord.phonetic && (
                <p className="text-lg opacity-90 mb-4">{currentWord.phonetic}</p>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); speakWord(); }}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors"
              >
                <Volume2 size={24} />
              </button>
              <p className="text-sm opacity-75 mt-8">Kartı çevirmek için tıklayın</p>
            </div>
          </div>

          {/* Arka Yüz */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180">
            <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center text-white">
              <div className="text-4xl mb-4">🇹🇷</div>
              <h2 className="text-4xl font-bold mb-6">{currentWord.translation}</h2>
              {currentWord.example && (
                <div className="bg-white/20 rounded-lg p-4 max-w-md">
                  <p className="text-sm opacity-90 italic">"{currentWord.example}"</p>
                </div>
              )}
              <p className="text-sm opacity-75 mt-8">Tekrar çevirmek için tıklayın</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kontroller */}
      <div className="flex items-center justify-between gap-4">
        
        {/* Önceki */}
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="bg-white border border-stone-200 p-3 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Biliyorum / Bilmiyorum */}
        <div className="flex gap-3">
          <button
            onClick={handleUnknown}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <X size={20} />
            Tekrar Et
          </button>
          <button
            onClick={handleKnown}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <Check size={20} />
            Biliyorum
          </button>
        </div>

        {/* Sonraki */}
        <button
          onClick={handleNext}
          disabled={currentIndex === words.length - 1}
          className="bg-white border border-stone-200 p-3 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Reset */}
      <div className="text-center mt-6">
        <button
          onClick={handleReset}
          className="text-slate-600 hover:text-slate-800 text-sm flex items-center gap-2 mx-auto transition-colors"
        >
          <RotateCcw size={16} />
          Baştan Başla
        </button>
      </div>
    </div>
  )
}
