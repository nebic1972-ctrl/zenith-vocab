'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  getCollectionWithWords,
  removeWordFromCollection,
  deleteCollection,
  getCollectionStats,
} from '@/lib/collectionsService'
import {
  getCollectionStatistics,
  getLevelColor,
} from '@/lib/statisticsService'
import type { CollectionStats } from '@/lib/statisticsService'
import type { CollectionWithWords } from '@/types/collection'
import { ArrowLeft, Plus, Trash2, Download, Share2 } from 'lucide-react'
import ExportCollectionModal from '@/components/ExportCollectionModal'
import ShareCollectionModal from '@/components/ShareCollectionModal'

const headerGradientClasses: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
  indigo: 'from-indigo-500 to-indigo-600',
  orange: 'from-orange-500 to-orange-600',
  cyan: 'from-cyan-500 to-cyan-600',
  red: 'from-red-500 to-red-600',
  yellow: 'from-yellow-500 to-yellow-600',
  pink: 'from-pink-500 to-pink-600',
  teal: 'from-teal-500 to-teal-600',
}

const levelColors: Record<string, string> = {
  A1: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  A2: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  B1: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  B2: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  C1: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  C2: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

interface CollectionWord {
  id: string
  word: string
  translation: string
  level: string
  category: string
  mastery_level: number
}

export default function CollectionDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const collectionId = params.id as string

  const [collection, setCollection] = useState<CollectionWithWords | null>(null)
  const [stats, setStats] = useState({
    total_words: 0,
    learned_words: 0,
    progress_percentage: 0,
  })
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [collectionStats, setCollectionStats] = useState<CollectionStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const fetchCollection = useCallback(async () => {
    if (!collectionId || !user?.id) return
    try {
      setLoading(true)
      const [collectionData, statsData] = await Promise.all([
        getCollectionWithWords(collectionId),
        getCollectionStats(collectionId).catch(() => ({
          total_words: 0,
          learned_words: 0,
          progress_percentage: 0,
        })),
      ])

      if (collectionData.user_id !== user.id && !collectionData.is_public) {
        toast.error('Bu koleksiyona erişim yetkiniz yok')
        router.push('/collections')
        return
      }

      setCollection(collectionData)
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching collection:', error)
      toast.error('Koleksiyon yüklenemedi')
      router.push('/collections')
    } finally {
      setLoading(false)
    }
  }, [collectionId, router, user?.id])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user && collectionId) {
      fetchCollection()
    }
  }, [user, authLoading, collectionId, router, fetchCollection])

  const handleRemoveWord = async (wordId: string) => {
    if (!collectionId) return
    setRemovingId(wordId)
    try {
      await removeWordFromCollection(collectionId, wordId)
      toast.success('Kelime koleksiyondan çıkarıldı')
      fetchCollection()
    } catch (error) {
      console.error('Error removing word:', error)
      toast.error('Kelime çıkarılamadı')
    } finally {
      setRemovingId(null)
    }
  }

  const handleStartFlashcards = () => {
    const wordList = (collection?.words || []).filter(Boolean)
    if (!collection || wordList.length === 0) {
      toast.error('Koleksiyonda kelime yok')
      return
    }
    router.push(`/flashcards?collection=${collectionId}`)
  }

  const handleDeleteCollection = async () => {
    if (!confirm('Bu koleksiyonu silmek istediğinize emin misiniz? Tüm kelimeler koleksiyondan çıkarılacak.')) return

    try {
      await deleteCollection(collectionId)
      toast.success('🗑️ Koleksiyon silindi')
      router.push('/collections')
    } catch (error) {
      console.error('Error deleting collection:', error)
      toast.error('Koleksiyon silinemedi')
    }
  }

  const loadCollectionStats = async () => {
    if (!user?.id) return
    setStatsLoading(true)
    try {
      const stats = await getCollectionStatistics(collectionId, user.id)
      setCollectionStats(stats)
      setShowStats(true)
    } catch (error) {
      console.error('Error loading collection stats:', error)
      toast.error('İstatistikler yüklenemedi')
    } finally {
      setStatsLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!collection) {
    return null
  }

  const words = (collection.words || []).filter(Boolean) as CollectionWord[]
  const headerGradientClass =
    headerGradientClasses[collection.color] || headerGradientClasses.blue

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Koleksiyonlara dön
        </Link>

        {/* Header */}
        <div
          className={`rounded-2xl p-8 bg-gradient-to-br ${headerGradientClass} text-white shadow-xl mb-8`}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <div className="text-6xl mb-4">{collection.icon}</div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {collection.name}
              </h1>
              <p className="text-white/80 text-lg mb-4">
                {collection.description || 'Açıklama yok'}
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span>📚 {stats.total_words} kelime</span>
                <span>✅ {stats.learned_words} öğrenildi</span>
                <span>📊 %{stats.progress_percentage} ilerleme</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartFlashcards}
                disabled={words.length === 0}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🎴 Flashcard Çalış
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/vocabulary')}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium flex items-center gap-2"
              >
                <Plus size={18} />
                Kelime Ekle
              </motion.button>
              {collection.user_id === user?.id && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowShareModal(true)}
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium flex items-center gap-2"
                >
                  <Share2 size={18} />
                  Paylaş
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowExportModal(true)}
                disabled={words.length === 0}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                Dışa Aktar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={loadCollectionStats}
                disabled={words.length === 0 || statsLoading}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {statsLoading ? '⏳' : '📊'} İstatistikler
              </motion.button>
              <button
                onClick={handleDeleteCollection}
                className="px-6 py-3 bg-red-500/50 hover:bg-red-500/70 backdrop-blur-sm rounded-lg font-medium flex items-center gap-2"
              >
                <Trash2 size={18} />
                Sil
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 bg-white/20 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.progress_percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-white/80 rounded-full"
            />
          </div>
        </div>

        {/* Words List */}
        {words.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Bu koleksiyonda henüz kelime yok
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Sözlüğünüzden kelime ekleyerek başlayın
            </p>
            <Link
              href="/vocabulary"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              <Plus size={20} />
              Kelime Ekle
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Kelimeler ({words.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {words.map((word) => (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-md border border-gray-200 dark:border-gray-800 flex flex-col"
              >
                <div className="flex-1 mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {word.word}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {word.translation}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      levelColors[word.level] || levelColors.B1
                    }`}
                  >
                    {word.level}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                    {word.category}
                  </span>
                </div>

                <button
                  onClick={() => handleRemoveWord(word.id)}
                  disabled={removingId === word.id}
                  className="w-full px-3 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {removingId === word.id ? (
                    '⏳ Çıkarılıyor...'
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Koleksiyondan Çıkar
                    </>
                  )}
                </button>
              </motion.div>
            ))}
            </div>
          </div>
        )}

        <ExportCollectionModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          collection={collection}
        />
        {showShareModal && user && collection && (
          <ShareCollectionModal
            collectionId={collection.id}
            collectionName={collection.name}
            userId={user.id}
            isShared={collection.share_enabled ?? false}
            shareToken={collection.share_token ?? null}
            onClose={() => setShowShareModal(false)}
            onToggleShare={(enabled, token) => {
              setCollection(prev =>
                prev ? { ...prev, share_enabled: enabled, share_token: token } : null
              )
            }}
          />
        )}

        {/* İstatistik Modal */}
        {showStats && collectionStats && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowStats(false)}
            />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                📊 {collectionStats.collectionName} İstatistikleri
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {collectionStats.wordCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Toplam Kelime</div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {collectionStats.averageMastery.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Ortalama Seviye</div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 col-span-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Tamamlanma</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full transition-all"
                        style={{ width: `${collectionStats.completionRate}%` }}
                      />
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {collectionStats.completionRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {collectionStats.wordCount > 0 &&
                Object.keys(collectionStats.levelDistribution).length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Seviye Dağılımı
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(collectionStats.levelDistribution).map(([level, count]) => (
                        <div key={level} className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8">
                            {level}
                          </span>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${(count / collectionStats.wordCount) * 100}%`,
                                backgroundColor: getLevelColor(level),
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <button
                onClick={() => setShowStats(false)}
                className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-700"
              >
                Kapat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
