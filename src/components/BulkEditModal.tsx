'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { VocabularyWord } from '@/types/collection'

export interface BulkChanges {
  category?: string
  level?: string
}

interface BulkEditModalProps {
  selectedWords: VocabularyWord[]
  onSave: (changes: BulkChanges) => void
  onCancel: () => void
}

const CATEGORIES = [
  'daily',
  'business',
  'academic',
  'technical',
  'travel',
  'food',
  'medical',
  'legal',
  'sports',
  'entertainment',
  'science',
  'art',
  'politics',
  'finance',
  'education',
  'technology'
]

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export default function BulkEditModal({
  selectedWords,
  onSave,
  onCancel
}: BulkEditModalProps) {
  const [category, setCategory] = useState<string>('')
  const [level, setLevel] = useState<string>('')

  const handleSave = () => {
    const changes: BulkChanges = {}
    if (category) changes.category = category
    if (level) changes.level = level
    if (Object.keys(changes).length > 0) {
      onSave(changes)
    }
    onCancel()
  }

  const hasChanges = category || level

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onCancel}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full"
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Toplu Düzenleme
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {selectedWords.length} kelime için değişiklik uygulanacak
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="">Değiştirme</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seviye
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="">Değiştirme</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Uygula
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
