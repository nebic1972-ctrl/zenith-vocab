'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Volume2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  fetchWordDefinition,
  formatDefinition,
  getAudioUrl,
  getExampleSentence,
  type DictionaryDefinition,
} from '@/lib/services/dictionary'
import type { GeminiAnalysis } from '@/lib/services/gemini'

interface VocabularyWord {
  id: string
  word: string
  definition: string | null
  example_sentence: string | null
  status: string | null
  ease_factor: number
  interval_days: number
  review_count: number
  next_review_date: string | null
  created_at: string
}

interface WordDetailModalProps {
  word: VocabularyWord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WordDetailModal({ word, open, onOpenChange }: WordDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [dictionaryData, setDictionaryData] = useState<DictionaryDefinition | null>(null)
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiAnalysis | null>(null)

  const loadWordData = async () => {
    if (!word) return

    setLoading(true)
    setDictionaryData(null)
    setGeminiAnalysis(null)

    try {
      // Dictionary API
      const dictData = await fetchWordDefinition(word.word)
      setDictionaryData(dictData)

      // Gemini AI (API route üzerinden)
      const contextSentence = word.example_sentence || word.definition || ''
      if (contextSentence) {
        try {
          const response = await fetch('/api/ai/analyze-word', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              word: word.word,
              contextSentence,
            }),
          })

          if (response.ok) {
            const analysis = await response.json()
            setGeminiAnalysis(analysis)
          }
        } catch (error) {
          console.error('Gemini analysis failed:', error)
        }
      }
    } catch (error) {
      console.error('Error loading word data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && word) {
      loadWordData()
    }
  }, [open, word?.id])

  const speakWord = (w: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(w)
      utterance.lang = 'en-US'
      speechSynthesis.speak(utterance)
    }
  }

  const playAudio = (url: string) => {
    const audio = new Audio(url)
    audio.play()
  }

  const difficultyLabels: Record<string, string> = {
    beginner: 'Başlangıç',
    intermediate: 'Orta',
    advanced: 'İleri',
  }

  if (!word) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-2xl font-bold">{word.word}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => speakWord(word.word)}
              className="h-9 w-9"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
            {dictionaryData && getAudioUrl(dictionaryData) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => playAudio(getAudioUrl(dictionaryData!)!)}
              >
                Dinle
              </Button>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dictionary */}
            {dictionaryData && (
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2">Sözlük</h4>
                <p className="text-slate-800">{formatDefinition(dictionaryData)}</p>
                {getExampleSentence(dictionaryData) && (
                  <p className="text-sm text-slate-600 italic mt-2">
                    &quot;{getExampleSentence(dictionaryData)}&quot;
                  </p>
                )}
              </div>
            )}

            {/* Context sentence from vocabulary */}
            {word.example_sentence && (
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2">Bağlam</h4>
                <p className="text-slate-800 italic">&quot;{word.example_sentence}&quot;</p>
              </div>
            )}

            {/* Gemini AI Analysis */}
            {geminiAnalysis && (
              <div className="space-y-4 rounded-lg bg-slate-50 p-4 border">
                <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  AI Analizi
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500">Çeviri: </span>
                    <span className="text-slate-800">{geminiAnalysis.translation}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Bağlam analizi: </span>
                    <p className="text-slate-800 text-sm">{geminiAnalysis.contextAnalysis}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Zorluk: </span>
                    <span className="text-slate-800">
                      {difficultyLabels[geminiAnalysis.difficulty] || geminiAnalysis.difficulty}
                    </span>
                  </div>
                  {geminiAnalysis.exampleSentences?.length > 0 && (
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Örnek cümleler:</span>
                      <ul className="list-disc list-inside text-sm text-slate-800 space-y-1">
                        {geminiAnalysis.exampleSentences.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {geminiAnalysis.tips && (
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">İpuçları:</span>
                      <p className="text-slate-800 text-sm">{geminiAnalysis.tips}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!dictionaryData && !geminiAnalysis && !loading && (
              <p className="text-slate-500 text-sm">Bu kelime için veri yüklenemedi.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
