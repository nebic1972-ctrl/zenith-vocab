'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  translateWord,
  translateWordsBatch,
  isGeminiAvailable,
  type TranslationResult,
} from '@/lib/geminiTranslationService'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { X, Loader2, Plus, Languages } from 'lucide-react'

interface TranslateModalProps {
  isOpen: boolean
  onClose: () => void
  onWordAdded?: () => void
  /** Seçili kelime ID'leri - verilirse sözlükteki kelimeleri çevirip günceller */
  wordIds?: string[]
  onTranslated?: () => void
}

const levelColors: Record<string, string> = {
  A1: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  A2: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  B1: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  B2: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  C1: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  C2: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

export default function TranslateModal({
  isOpen,
  onClose,
  onWordAdded,
  wordIds = [],
  onTranslated,
}: TranslateModalProps) {
  const { user } = useAuth()
  const [inputText, setInputText] = useState('')
  const [results, setResults] = useState<TranslationResult[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [addingId, setAddingId] = useState<string | null>(null)

  const isBatchMode = wordIds.length > 0

  const handleTranslateBatch = async () => {
    if (wordIds.length === 0) {
      toast.error('Kelime seçilmedi')
      return
    }

    if (!isGeminiAvailable()) {
      toast.error('Gemini API anahtarı yapılandırılmamış.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: words, error: fetchError } = await supabase
        .from('vocabulary_words')
        .select('id, word')
        .in('id', wordIds)

      if (fetchError) throw fetchError
      if (!words?.length) {
        toast.error('Kelimeler bulunamadı')
        return
      }

      const { translations, failed } = await translateWordsBatch(
        words.map((w) => w.word),
        'en',
        'tr',
        (done, total) => setProgress({ done, total })
      )

      let successCount = 0
      for (const translation of translations) {
        const word = words.find((w) => w.word === translation.word)
        if (!word) continue

        const { error: updateError } = await supabase
          .from('vocabulary_words')
          .update({
            translation: translation.translation,
            level: translation.level,
            definition: translation.definition ?? null,
            example_sentence: translation.example_sentence ?? null,
          })
          .eq('id', word.id)

        if (!updateError) successCount++
      }

      if (successCount > 0) toast.success(`✅ ${successCount} kelime çevrildi!`)
      if (failed.length > 0) toast.error(`⚠️ ${failed.length} kelime çevrilemedi`)

      onTranslated?.()
      onClose()
    } catch (error) {
      console.error('Translation error:', error)
      toast.error('Çeviri başarısız')
    } finally {
      setLoading(false)
      setProgress({ done: 0, total: 0 })
    }
  }

  const handleTranslate = async () => {
    const words = inputText
      .trim()
      .split(/[\s,;]+/)
      .map((w) => w.trim())
      .filter(Boolean)

    if (words.length === 0) {
      toast.error('Lütfen en az bir kelime girin')
      return
    }

    if (!isGeminiAvailable()) {
      toast.error('Gemini API anahtarı yapılandırılmamış. .env dosyasını kontrol edin.')
      return
    }

    setLoading(true)
    setResults([])

    try {
      if (words.length === 1) {
        const result = await translateWord(words[0])
        setResults([result])
        toast.success('Çeviri tamamlandı')
      } else {
        const batch = await translateWordsBatch(
          words,
          'en',
          'tr',
          (done, total) => setProgress({ done, total })
        )
        setResults(batch.translations)
        if (batch.failed.length > 0) {
          toast.error(`${batch.failed.length} kelime çevrilemedi`)
        } else {
          toast.success(`${batch.translations.length} kelime çevrildi`)
        }
      }
    } catch (error) {
      console.error('Translate error:', error)
      toast.error(error instanceof Error ? error.message : 'Çeviri başarısız')
    } finally {
      setLoading(false)
      setProgress({ done: 0, total: 0 })
    }
  }

  const handleAddToVocabulary = async (result: TranslationResult) => {
    if (!user?.id) {
      toast.error('Kelime eklemek için giriş yapın')
      return
    }

    setAddingId(result.word)

    try {
      const supabase = createClient()
      const { error } = await supabase.from('vocabulary_words').insert({
        user_id: user.id,
        word: result.word,
        translation: result.translation,
        definition: result.definition || null,
        example_sentence: result.example_sentence || null,
        category: 'daily',
        level: result.level,
        mastery_level: 0,
      })

      if (error) {
        if (error.code === '23505') {
          toast.error('Bu kelime zaten sözlüğünüzde')
        } else {
          throw error
        }
        return
      }

      toast.success(`"${result.word}" eklendi`)
      onWordAdded?.()
    } catch (error) {
      console.error('Add word error:', error)
      toast.error('Kelime eklenemedi')
    } finally {
      setAddingId(null)
    }
  }

  const reset = () => {
    setInputText('')
    setResults([])
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Languages size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Çeviri</h2>
                <p className="text-white/80 text-sm">
                  Gemini 2.5 Flash ile kelime çevirisi
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!isGeminiAvailable() && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-sm">
                Gemini API anahtarı yapılandırılmamış. .env.local dosyasına{' '}
                <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                  NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY
                </code>{' '}
                veya{' '}
                <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                  GOOGLE_GENERATIVE_AI_API_KEY
                </code>{' '}
                ekleyin.
              </div>
            )}

            {isBatchMode ? (
              <>
                <p className="text-gray-600 dark:text-gray-400">
                  {wordIds.length} kelime Gemini 2.5 Flash ile çevrilecek.
                </p>

                {loading && (
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span>İlerleme</span>
                      <span>
                        {progress.done} / {progress.total || wordIds.length}
                      </span>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
                        }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium disabled:opacity-50"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleTranslateBatch}
                    disabled={loading || !isGeminiAvailable()}
                    className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Çevriliyor...
                      </>
                    ) : (
                      '🚀 Başlat'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Kelime veya kelimeler (virgülle ayırabilirsiniz)
                  </label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="örn: however, therefore, although"
                    rows={3}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none disabled:opacity-60"
                  />
                </div>

                <button
                  onClick={handleTranslate}
                  disabled={loading || !inputText.trim() || !isGeminiAvailable()}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {progress.total > 0
                        ? `Çevriliyor... ${progress.done}/${progress.total}`
                        : 'Çevriliyor...'}
                    </>
                  ) : (
                    <>
                      <Languages size={20} />
                      Çevir
                    </>
                  )}
                </button>
              </>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Sonuçlar ({results.length})
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {results.map((r) => (
                    <motion.div
                      key={r.word}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-lg text-gray-900 dark:text-white">
                              {r.word}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                levelColors[r.level] || levelColors.B1
                              }`}
                            >
                              {r.level}
                            </span>
                          </div>
                          <p className="text-cyan-600 dark:text-cyan-400 font-medium mt-1">
                            {r.translation}
                          </p>
                          {r.definition && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {r.definition}
                            </p>
                          )}
                          {r.example_sentence && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 italic">
                              &quot;{r.example_sentence}&quot;
                            </p>
                          )}
                        </div>
                        {user && (
                          <button
                            onClick={() => handleAddToVocabulary(r)}
                            disabled={addingId === r.word}
                            className="flex-shrink-0 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
                          >
                            {addingId === r.word ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Plus size={16} />
                            )}
                            Ekle
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
