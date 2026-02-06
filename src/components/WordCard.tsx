'use client'

import { useState } from 'react'
import { Volume2, Star, Trash2, Edit, BookOpen, TrendingUp } from 'lucide-react'

interface WordCardProps {
  word: string
  translation: string
  phonetic?: string
  example?: string
  category: string
  level: string
  progress?: number
  isFavorite?: boolean
  onToggleFavorite?: () => void
  onDelete?: () => void
  onEdit?: () => void
}

export default function WordCard({
  word,
  translation,
  phonetic,
  example,
  category,
  level,
  progress = 0,
  isFavorite = false,
  onToggleFavorite,
  onDelete,
  onEdit
}: WordCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const speakWord = (e: React.MouseEvent) => {
    e.stopPropagation()
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      window.speechSynthesis.speak(utterance)
    }
  }

  const levelColors: Record<string, string> = {
    'A1': 'bg-green-50 text-green-700 border-green-200',
    'A2': 'bg-green-100 text-green-800 border-green-300',
    'B1': 'bg-blue-50 text-blue-700 border-blue-200',
    'B2': 'bg-blue-100 text-blue-800 border-blue-300',
    'C1': 'bg-purple-50 text-purple-700 border-purple-200',
    'C2': 'bg-purple-100 text-purple-800 border-purple-300',
  }

  return (
    <div 
      className="bg-white rounded-xl border border-stone-200 hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Üst Kısım */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-2xl font-bold text-slate-800">{word}</h3>
              <button
                onClick={speakWord}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Volume2 size={18} className="text-slate-600" />
              </button>
            </div>
            {phonetic && (
              <p className="text-sm text-slate-500 mb-2">{phonetic}</p>
            )}
            <p className="text-slate-700 font-medium">{translation}</p>
          </div>

          {/* Favori Butonu */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite?.()
            }}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Star 
              size={20} 
              className={isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}
            />
          </button>
        </div>

        {/* Etiketler */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${levelColors[level] || 'bg-slate-50 text-slate-700'}`}>
            {level}
          </span>
          <span className="text-xs bg-slate-50 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
            {category}
          </span>
        </div>

        {/* İlerleme Barı */}
        {progress > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-600 flex items-center gap-1">
                <TrendingUp size={12} />
                İlerleme
              </span>
              <span className="text-xs font-semibold text-slate-700">%{progress}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Genişletilmiş Alan */}
        {isExpanded && example && (
          <div className="mt-4 pt-4 border-t border-stone-200">
            <div className="flex items-start gap-2 mb-3">
              <BookOpen size={16} className="text-slate-500 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 mb-1">Örnek Cümle:</p>
                <p className="text-sm text-slate-700 italic">"{example}"</p>
              </div>
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.()
                }}
                className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Edit size={14} />
                Düzenle
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.()
                }}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 size={14} />
                Sil
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Genişletme İpucu */}
      {!isExpanded && example && (
        <div className="bg-slate-50 px-5 py-2 text-center border-t border-stone-200">
          <p className="text-xs text-slate-500">Detaylar için tıklayın</p>
        </div>
      )}
    </div>
  )
}
