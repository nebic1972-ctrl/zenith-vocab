'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  parseCollectionJSONFile,
  validateImportedCollection,
  importCollection,
  type ExportedCollection
} from '@/lib/exportImportService'

interface ImportCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onImported: () => void
}

export default function ImportCollectionModal({
  isOpen,
  onClose,
  userId,
  onImported
}: ImportCollectionModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ExportedCollection | null>(null)
  const [importing, setImporting] = useState(false)
  const [mergeExisting, setMergeExisting] = useState(true)

  const resetModal = () => {
    setFile(null)
    setPreview(null)
    setMergeExisting(true)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.json')) {
      toast.error('Lütfen JSON dosyası seçin')
      return
    }

    setFile(selectedFile)

    try {
      const data = await parseCollectionJSONFile(selectedFile)
      const validation = validateImportedCollection(data)

      if (!validation.valid) {
        toast.error(`Geçersiz dosya: ${validation.errors[0]}`)
        setFile(null)
        return
      }

      setPreview(data)
    } catch (error) {
      console.error('Parse error:', error)
      toast.error('Dosya okunamadı')
      setFile(null)
    }

    e.target.value = ''
  }

  const handleImport = async () => {
    if (!preview) return

    setImporting(true)

    try {
      const result = await importCollection(preview, userId, {
        mergeExisting
      })

      toast.success(
        `✅ ${result.wordsAdded} kelime eklendi!` +
          (result.wordsSkipped > 0 ? ` (${result.wordsSkipped} atlandı)` : '')
      )

      onImported()
      resetModal()
      onClose()
    } catch (error) {
      console.error('Import error:', error)
      toast.error(error instanceof Error ? error.message : 'İçe aktarma başarısız')
    } finally {
      setImporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              📥 Koleksiyon İçe Aktar
            </h2>

            {!preview ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📁</div>

                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                    📂 JSON Dosyası Seç
                  </div>
                </label>

                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Dışa aktarılmış koleksiyon JSON dosyasını seçin
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-4xl">{preview.collection.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {preview.collection.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {preview.words.length} kelime
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mergeExisting}
                      onChange={(e) => setMergeExisting(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Mevcut kelimelerle birleştir
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                    {mergeExisting
                      ? 'Aynı kelimeler varsa koleksiyona eklenecek'
                      : 'Aynı kelimeler atlanacak'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={resetModal}
                    disabled={importing}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium disabled:opacity-50"
                  >
                    Geri
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
                  >
                    {importing ? '⏳ İçe Aktarılıyor...' : '📥 İçe Aktar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
