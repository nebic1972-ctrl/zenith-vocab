'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { getCollections, addWordToCollection } from '@/lib/collectionsService'
import type { Collection } from '@/types/collection'

const colorClasses: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600 ring-2 ring-blue-400',
  green: 'from-green-500 to-green-600 ring-2 ring-green-400',
  purple: 'from-purple-500 to-purple-600 ring-2 ring-purple-400',
  indigo: 'from-indigo-500 to-indigo-600 ring-2 ring-indigo-400',
  orange: 'from-orange-500 to-orange-600 ring-2 ring-orange-400',
  cyan: 'from-cyan-500 to-cyan-600 ring-2 ring-cyan-400',
  red: 'from-red-500 to-red-600 ring-2 ring-red-400',
  yellow: 'from-yellow-500 to-yellow-600 ring-2 ring-yellow-400',
  pink: 'from-pink-500 to-pink-600 ring-2 ring-pink-400',
  teal: 'from-teal-500 to-teal-600 ring-2 ring-teal-400',
}

interface AddToCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  wordIds: string[]
  userId: string
}

export default function AddToCollectionModal({
  isOpen,
  onClose,
  wordIds,
  userId
}: AddToCollectionModalProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      fetchCollections()
    }
  }, [isOpen])

  const fetchCollections = async () => {
    try {
      const data = await getCollections(userId)
      setCollections(data)
    } catch (error) {
      console.error('Error fetching collections:', error)
      toast.error('Koleksiyonlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (wordIds.length === 0) {
      toast.error('Lütfen en az bir kelime seçin')
      return
    }
    if (!selectedCollectionId) {
      toast.error('Lütfen bir koleksiyon seçin')
      return
    }

    setAdding(true)

    try {
      let successCount = 0
      let alreadyExistsCount = 0

      for (const wordId of wordIds) {
        try {
          await addWordToCollection(selectedCollectionId, wordId)
          successCount++
        } catch (error: any) {
          if (error.message.includes('zaten koleksiyonda')) {
            alreadyExistsCount++
          } else {
            throw error
          }
        }
      }

      if (successCount > 0) {
        toast.success(`✅ ${successCount} kelime eklendi!`)
      }
      if (alreadyExistsCount > 0) {
        toast(`ℹ️ ${alreadyExistsCount} kelime zaten koleksiyondaydı`, {
          icon: 'ℹ️'
        })
      }

      onClose()
    } catch (error) {
      console.error('Error adding to collection:', error)
      toast.error('Kelimeler eklenemedi')
    } finally {
      setAdding(false)
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
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                📚 Koleksiyona Ekle
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {wordIds.length} kelime seçildi
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Yükleniyor...</p>
              </div>
            ) : collections.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">📚</div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Henüz koleksiyon oluşturmadınız
                </p>
                <button
                  onClick={() => {
                    onClose()
                    window.location.href = '/collections'
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Koleksiyon Oluştur
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {collections.map((collection) => {
                  const colorClass = colorClasses[collection.color] || colorClasses.blue
                  const isSelected = selectedCollectionId === collection.id
                  return (
                  <motion.button
                    key={collection.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCollectionId(collection.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      isSelected
                        ? `bg-gradient-to-br ${colorClass} text-white shadow-lg`
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{collection.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold">{collection.name}</h3>
                        <p className={`text-sm ${
                          isSelected
                            ? 'text-white/80'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {collection.word_count || 0} kelime
                        </p>
                      </div>
                      {isSelected && (
                        <span className="text-2xl">✓</span>
                      )}
                    </div>
                  </motion.button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {collections.length > 0 && (
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
              >
                İptal
              </button>
              <button
                onClick={handleAdd}
                disabled={wordIds.length === 0 || !selectedCollectionId || adding}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
              >
                {adding ? '⏳ Ekleniyor...' : '✅ Ekle'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
