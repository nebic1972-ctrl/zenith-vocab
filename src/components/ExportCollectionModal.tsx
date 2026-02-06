'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { exportCollection, downloadCollectionJSON } from '@/lib/exportImportService'
import type { Collection } from '@/types/collection'

interface ExportCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  collection: Collection
}

export default function ExportCollectionModal({
  isOpen,
  onClose,
  collection
}: ExportCollectionModalProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)

    try {
      const exported = await exportCollection(collection.id)
      downloadCollectionJSON(exported)
      
      toast.success('✅ Koleksiyon dışa aktarıldı!')
      onClose()
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Dışa aktarma başarısız')
    } finally {
      setExporting(false)
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
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full"
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              📤 Koleksiyonu Dışa Aktar
            </h2>

            <div className="mb-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-4xl">{collection.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {collection.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {collection.word_count || 0} kelime
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>✅</span>
                <span>Tüm kelimeler ve çevirileri</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>✅</span>
                <span>Tanımlar ve örnek cümleler</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>✅</span>
                <span>Koleksiyon ayarları</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>📄</span>
                <span>JSON formatında</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={exporting}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium disabled:opacity-50"
              >
                İptal
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
              >
                {exporting ? '⏳ Dışa Aktarılıyor...' : '📤 Dışa Aktar'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
