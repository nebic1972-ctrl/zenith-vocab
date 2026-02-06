'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { getVocabularyWords, deleteWord } from '@/lib/vocabularyService'
import { getCollections } from '@/lib/collectionsService'
import {
  bulkDeleteWords,
  bulkUpdateCategory,
  bulkUpdateLevel
} from '@/lib/bulkOperationsService'
import BulkActionBar from '@/components/BulkActionBar'
import BulkEditModal from '@/components/BulkEditModal'
import type { VocabularyWord } from '@/types/collection'

export default function VocabularyPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [words, setWords] = useState<VocabularyWord[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  
  // Selection state
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set())
  const [showBulkModal, setShowBulkModal] = useState(false)
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadWords()
      loadCollections()
    }
  }, [user, selectedLevel, selectedCategory])

  const checkUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }
    
    setUser(user)
  }

  const loadWords = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const data = await getVocabularyWords(user.id, {
        level: selectedLevel || undefined,
        category: selectedCategory || undefined
      })
      setWords(data)
    } catch (error) {
      console.error('Error loading words:', error)
      toast.error('Kelimeler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const loadCollections = async () => {
    if (!user) return
    
    try {
      const data = await getCollections(user.id)
      setCollections(data)
    } catch (error) {
      console.error('Error loading collections:', error)
    }
  }

  const handleDelete = async (wordId: string) => {
    if (!user) return
    
    if (!confirm('Bu kelimeyi silmek istediğinizden emin misiniz?')) {
      return
    }
    
    setDeleting(wordId)
    
    try {
      await deleteWord(wordId, user.id)
      toast.success('Kelime silindi')
      loadWords()
    } catch (error) {
      console.error('Error deleting word:', error)
      toast.error('Kelime silinemedi')
    } finally {
      setDeleting(null)
    }
  }

  const handleSelectAll = () => {
    if (selectedWords.size === filteredWords.length) {
      setSelectedWords(new Set())
    } else {
      setSelectedWords(new Set(filteredWords.map(w => w.id)))
    }
  }

  const handleSelectWord = (wordId: string) => {
    const newSelected = new Set(selectedWords)
    if (newSelected.has(wordId)) {
      newSelected.delete(wordId)
    } else {
      newSelected.add(wordId)
    }
    setSelectedWords(newSelected)
  }

  const handleBulkActionComplete = () => {
    setSelectedWords(new Set())
    setShowBulkModal(false)
    loadWords()
  }

  const handleBulkDelete = async () => {
    if (!user || selectedWords.size === 0) return
    if (!confirm(`${selectedWords.size} kelime silinecek. Emin misiniz?`)) return
    try {
      await bulkDeleteWords(Array.from(selectedWords), user.id)
      toast.success('Kelimeler silindi')
      handleBulkActionComplete()
    } catch {
      toast.error('Silme başarısız')
    }
  }

  const handleBulkSave = async (changes: { category?: string; level?: string }) => {
    if (!user || selectedWords.size === 0) return
    try {
      const ids = Array.from(selectedWords)
      if (changes.category) await bulkUpdateCategory(ids, changes.category, user.id)
      if (changes.level) await bulkUpdateLevel(ids, changes.level, user.id)
      toast.success('Değişiklikler kaydedildi')
      handleBulkActionComplete()
    } catch {
      toast.error('Güncelleme başarısız')
    }
  }

  // Filter words
  const filteredWords = words.filter((word) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        word.word.toLowerCase().includes(query) ||
        word.translation?.toLowerCase().includes(query) ||
        word.definition?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const selectedWordsList = filteredWords.filter((w) => selectedWords.has(w.id))

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const categories = Array.from(new Set(words.map(w => w.category).filter(Boolean)))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              📚 Kelime Dağarcığım
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {filteredWords.length} kelime
              {selectedWords.size > 0 && ` • ${selectedWords.size} seçili`}
            </p>
          </div>
          <button
            onClick={() => router.push('/vocabulary/add')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            ➕ Yeni Kelime
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Kelime ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Level Filter */}
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Seviye:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedLevel(null)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedLevel === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Tümü
              </button>
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedLevel === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Kategori:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === null
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Tümü
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bulk Action Bar */}
        <AnimatePresence>
          {selectedWords.size > 0 && (
            <BulkActionBar
              selectedCount={selectedWords.size}
              onAddToCollection={() => toast.info('Yakında')}
              onRemoveFromCollection={() => toast.info('Yakında')}
              onDelete={handleBulkDelete}
              onChangeCategory={() => setShowBulkModal(true)}
              onChangeLevel={() => setShowBulkModal(true)}
              onExport={() => toast.info('Yakında')}
              onTranslate={() => toast.info('Yakında')}
              onClearSelection={() => setSelectedWords(new Set())}
            />
          )}
        </AnimatePresence>

        {/* Words List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Kelimeler yükleniyor...</p>
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery || selectedLevel || selectedCategory
                ? 'Kelime Bulunamadı'
                : 'Henüz Kelime Eklemediniz'
              }
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || selectedLevel || selectedCategory
                ? 'Farklı bir filtre deneyin'
                : 'İlk kelimenizi ekleyerek başlayın'
              }
            </p>
            {!searchQuery && !selectedLevel && !selectedCategory && (
              <button
                onClick={() => router.push('/vocabulary/add')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all"
              >
                ➕ Kelime Ekle
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg">
              <input
                type="checkbox"
                checked={selectedWords.size === filteredWords.length}
                onChange={handleSelectAll}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tümünü Seç ({filteredWords.length})
              </span>
            </div>

            {/* Word Cards */}
            {filteredWords.map((word, index) => (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedWords.has(word.id)}
                      onChange={() => handleSelectWord(word.id)}
                      className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {word.word}
                          </h3>
                          {word.translation && (
                            <p className="text-lg text-gray-600 dark:text-gray-400">
                              {word.translation}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full">
                            {word.level}
                          </span>
                          {word.category && (
                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-full">
                              {word.category}
                            </span>
                          )}
                        </div>
                      </div>

                      {word.definition && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {word.definition}
                        </p>
                      )}

                      {word.example_sentence && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 italic mb-4">
                          "{word.example_sentence}"
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => router.push(`/vocabulary/edit/${word.id}`)}
                          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          ✏️ Düzenle
                        </button>
                        <button
                          onClick={() => handleDelete(word.id)}
                          disabled={deleting === word.id}
                          className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleting === word.id ? '⏳' : '🗑️'} Sil
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Edit Modal */}
      {showBulkModal && (
        <BulkEditModal
          selectedWords={selectedWordsList}
          onSave={handleBulkSave}
          onCancel={() => setShowBulkModal(false)}
        />
      )}
    </div>
  )
}
