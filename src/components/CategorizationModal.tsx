'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { analyzeWord, type WordAnalysis } from '@/lib/aiCategorization'

interface Word {
  word: string
  translation: string
  definition?: string
  example_sentence?: string
}

interface CategorizationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  word: Word
  onApply?: (category: string, level: string) => void
}

export default function CategorizationModal({
  open,
  onOpenChange,
  word,
  onApply,
}: CategorizationModalProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<WordAnalysis | null>(null)

  const handleAnalyze = async () => {
    setLoading(true)
    setResult(null)
    try {
      const analysis = await analyzeWord(
        word.word,
        word.translation,
        word.definition,
        word.example_sentence
      )
      setResult(analysis)
    } catch {
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const topCategory = result?.categories?.[0]?.category ?? 'daily'
  const level = result?.level?.level ?? 'B1'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Kategorilendirme</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              ✨ Gemini 2.5 Flash Kategorilendirme
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {word.word} • {word.translation}
            </p>
          </div>

          {!result && !loading && (
            <Button
              onClick={handleAnalyze}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner-small"></div>
                  Gemini 2.5 analiz ediyor...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  ✨ Gemini 2.5 ile Analiz Et
                </span>
              )}
            </Button>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="spinner-small"></div>
              <span className="ml-3 text-gray-400">Gemini 2.5 analiz ediyor...</span>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 p-3 rounded-lg bg-gray-800">
                  <p className="text-xs text-gray-500 mb-1">Kategori</p>
                  <p className="font-semibold capitalize">{topCategory}</p>
                </div>
                <div className="flex-1 p-3 rounded-lg bg-gray-800">
                  <p className="text-xs text-gray-500 mb-1">Seviye</p>
                  <p className="font-semibold">{level}</p>
                </div>
              </div>
              {onApply && (
                <Button
                  onClick={() => {
                    onApply(topCategory, level)
                    onOpenChange(false)
                  }}
                  className="w-full"
                >
                  Uygula
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
