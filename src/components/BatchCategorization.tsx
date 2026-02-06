'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { bulkCategorize } from '@/lib/aiCategorization'
import { soundManager } from '@/lib/soundManager'
import { haptics } from '@/lib/haptics'
import toast from 'react-hot-toast'

interface BatchCategorizationProps {
  isOpen: boolean
  onClose: () => void
  words: Array<{
    id: string
    word: string
    translation: string
    definition?: string
    example_sentence?: string
  }>
  onComplete: (results: Array<{
    id: string
    category: string
    level: string
  }>) => Promise<void>
}

export default function BatchCategorization({
  isOpen,
  onClose,
  words,
  onComplete
}: BatchCategorizationProps) {
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState<any[]>([])

  const handleBatchAnalyze = async () => {
    setProcessing(true)
    setProgress({ current: 0, total: words.length })

    try {
      const analyses = await bulkCategorize(
        words.map(w => ({ word: w.word, translation: w.translation })),
        (current, total) => {
          setProgress({ current, total })
        }
      )

      const mappedResults = analyses.map((analysis) => {
        const originalWord = words.find(w => w.word === analysis.word)
        return {
          id: originalWord?.id || '',
          category: analysis.category,
          level: analysis.level
        }
      }).filter(r => r.id) // Remove any without ID

      setResults(mappedResults)
      soundManager.playSuccess()
      haptics.success()
      toast.success(`${mappedResults.length} kelime Gemini 2.5 ile kategorize edildi!`)
    } catch (error) {
      console.error('Batch analysis error:', error)
      soundManager.playError()
      haptics.error()
      toast.error('Toplu analiz başarısız oldu. Lütfen tekrar deneyin.')
    } finally {
      setProcessing(false)
    }
  }

  const handleApplyAll = async () => {
    try {
      await onComplete(results)
      soundManager.playSuccess()
      haptics.success()
      toast.success('Tüm değişiklikler kaydedildi!')
      onClose()
    } catch (error) {
      console.error('Apply error:', error)
      soundManager.playError()
      haptics.error()
      toast.error('Kaydetme başarısız oldu')
    }
  }

  const estimatedTime = Math.ceil(words.length / 5) * 2

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    ✨ Gemini 2.5 Flash Toplu Kategorilendirme
                  </h2>
                  <p className="text-gray-400">
                    {words.length} kelime analiz edilecek
                  </p>
                </div>

                {!processing && results.length === 0 && (
                  <div className="space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">💡</span>
                        <div className="flex-1">
                          <p className="text-sm text-blue-300 font-medium mb-2">
                            Optimize Edilmiş İşlem
                          </p>
                          <ul className="text-xs text-blue-200 space-y-1">
                            <li>• Kelimeler 5'li gruplar halinde işlenecek</li>
                            <li>• Tahmini süre: ~{estimatedTime} saniye</li>
                            <li>• Gemini 2.5 Flash ile hızlı ve doğru analiz</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleBatchAnalyze}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                    >
                      ✨ Gemini 2.5 Analizini Başlat
                    </button>
                  </div>
                )}

                {processing && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-2">
                        <div className="spinner-small"></div>
                        Gemini 2.5 Flash işliyor...
                      </span>
                      <span className="text-white font-mono font-bold">
                        {progress.current} / {progress.total}
                      </span>
                    </div>
                    
                    <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {Math.round((progress.current / progress.total) * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        Kalan süre: ~{Math.ceil((words.length - progress.current) / 5 * 2)} saniye
                      </div>
                    </div>
                  </div>
                )}

                {results.length > 0 && !processing && (
                  <div className="space-y-4">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-400 font-medium mb-2">
                        <span className="text-2xl">✅</span>
                        <span>Gemini 2.5 analizi tamamlandı!</span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {results.length} kelime başarıyla kategorize edildi
                      </p>
                    </div>
                    
                    {/* Preview */}
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-white mb-3">
                        Önizleme (ilk 5 kelime)
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {results.slice(0, 5).map((result, index) => {
                          const word = words.find(w => w.id === result.id)
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-900 rounded-lg"
                            >
                              <span className="text-white font-medium">
                                {word?.word}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                                  {result.category}
                                </span>
                                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">
                                  {result.level}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {results.length > 5 && (
                        <div className="text-center text-xs text-gray-500 mt-3">
                          +{results.length - 5} kelime daha...
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                      >
                        İptal
                      </button>
                      <button
                        onClick={handleApplyAll}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg"
                      >
                        ✨ Tümünü Uygula ve Kaydet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
