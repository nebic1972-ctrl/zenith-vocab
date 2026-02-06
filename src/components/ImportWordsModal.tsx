'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  extractTextFromFile,
  extractTextFromPaste,
  analyzeText,
} from '@/lib/textExtractor'
import { createClient } from '@/lib/supabase/client'

interface ImportWordsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onImported: () => void
}

export default function ImportWordsModal({
  isOpen,
  onClose,
  userId,
  onImported,
}: ImportWordsModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [pasteText, setPasteText] = useState('')
  const [extractedWords, setExtractedWords] = useState<string[]>([])
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [step, setStep] = useState<'upload' | 'select' | 'done'>('upload')
  const [mode, setMode] = useState<'file' | 'paste'>('file')

  const processText = (text: string) => {
    const analysis = analyzeText(text)
    setExtractedWords(analysis.topWords)
    setStep('select')
    toast.success(`✅ ${analysis.uniqueWords} benzersiz kelime bulundu!`)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Dosya boyutu 10MB\'dan küçük olmalı')
      return
    }

    if (selectedFile.name.toLowerCase().endsWith('.json')) {
      toast.error(
        'JSON dosyaları için Koleksiyonlar sayfasındaki "İçe Aktar" butonunu kullanın. Bu modal PDF, DOCX, TXT dosyalarından kelime çıkarmak içindir.'
      )
      e.target.value = ''
      return
    }

    setFile(selectedFile)
    setProcessing(true)

    try {
      const result = await extractTextFromFile(selectedFile)
      processText(result.text)
    } catch (error) {
      console.error('File processing error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Dosya işlenemedi'
      )
      setFile(null)
    } finally {
      setProcessing(false)
    }
  }

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) {
      toast.error('Lütfen metin yapıştırın')
      return
    }
    setProcessing(true)
    try {
      const result = extractTextFromPaste(pasteText)
      processText(result.text)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Metin işlenemedi'
      )
    } finally {
      setProcessing(false)
    }
  }

  const toggleWord = (word: string) => {
    const newSelection = new Set(selectedWords)
    if (newSelection.has(word)) {
      newSelection.delete(word)
    } else {
      newSelection.add(word)
    }
    setSelectedWords(newSelection)
  }

  const selectAll = () => setSelectedWords(new Set(extractedWords))
  const deselectAll = () => setSelectedWords(new Set())

  const handleImport = async () => {
    if (selectedWords.size === 0) {
      toast.error('Lütfen en az bir kelime seçin')
      return
    }

    setImporting(true)

    try {
      const supabase = createClient()
      const wordsToImport = Array.from(selectedWords).map((word) => ({
        user_id: userId,
        word,
        translation: 'Çeviri bekleniyor',
        category: 'daily',
        level: 'B1',
        mastery_level: 0,
      }))

      const { error } = await supabase
        .from('vocabulary_words')
        .insert(wordsToImport)

      if (error) throw error

      toast.success(`✅ ${selectedWords.size} kelime eklendi!`)
      setStep('done')
      onImported()

      setTimeout(() => {
        onClose()
        resetModal()
      }, 2000)
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Kelimeler eklenemedi')
    } finally {
      setImporting(false)
    }
  }

  const resetModal = () => {
    setFile(null)
    setPasteText('')
    setExtractedWords([])
    setSelectedWords(new Set())
    setStep('upload')
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                📄 Dosyadan Kelime Yükle
              </h2>
              <p className="text-white/80 text-sm mt-1">
                PDF, DOCX, EPUB, TXT dosyalarından veya metin yapıştırarak kelime çıkarın
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Step 1: Upload */}
            {step === 'upload' && (
              <div className="space-y-6">
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('file')}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      mode === 'file'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    📂 Dosya Yükle
                  </button>
                  <button
                    onClick={() => setMode('paste')}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      mode === 'paste'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    📋 Metin Yapıştır
                  </button>
                </div>

                {mode === 'file' ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-6">📁</div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.epub,.txt,.md"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={processing}
                      />
                      <div className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg transition-all">
                        {processing
                          ? '⏳ İşleniyor...'
                          : '📂 Dosya Seç'}
                      </div>
                    </label>
                    <p className="mt-6 text-gray-600 dark:text-gray-400">
                      Desteklenen: PDF, DOCX, EPUB, TXT, MD
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Maksimum: 10MB
                    </p>
                    {file && (
                      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          📄 {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <textarea
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder="Metni buraya yapıştırın..."
                      className="w-full h-40 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 resize-none"
                    />
                    <button
                      onClick={handlePasteSubmit}
                      disabled={!pasteText.trim() || processing}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold"
                    >
                      {processing ? '⏳ İşleniyor...' : 'Kelime Çıkar'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Words */}
            {step === 'select' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Kelimeleri Seçin
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {extractedWords.length} kelime bulundu, {selectedWords.size} seçildi
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 font-medium"
                    >
                      Tümünü Seç
                    </button>
                    <button
                      onClick={deselectAll}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 font-medium"
                    >
                      Temizle
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-96 overflow-y-auto">
                  {extractedWords.map((word) => (
                    <button
                      key={word}
                      onClick={() => toggleWord(word)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedWords.has(word)
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Done */}
            {step === 'done' && (
              <div className="text-center py-12">
                <div className="text-6xl mb-6">✅</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Kelimeler Eklendi!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedWords.size} kelime başarıyla içe aktarıldı
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {step === 'select' && (
            <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex gap-3">
              <button
                onClick={() => {
                  setStep('upload')
                  resetModal()
                }}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
              >
                ← Geri
              </button>
              <button
                onClick={handleImport}
                disabled={selectedWords.size === 0 || importing}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
              >
                {importing
                  ? '⏳ Ekleniyor...'
                  : `✅ ${selectedWords.size} Kelime Ekle`}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
