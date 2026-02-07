'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner' 
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  searchPublicCollections,
  getCollectionCategories,
  cloneSharedCollection,
  type SharedCollection
} from '@/lib/sharingService'

export default function ExplorePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [collections, setCollections] = useState<SharedCollection[]>([])
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [cloning, setCloning] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'most_cloned'>('popular')

  useEffect(() => {
    checkUser()
    loadCategories()
  }, [])

  useEffect(() => {
    loadCollections()
  }, [searchQuery, selectedCategory, sortBy])

  const checkUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadCategories = async () => {
    try {
      const cats = await getCollectionCategories()
      setCategories(cats)
    } catch (error) {
      console.warn('Categories could not be loaded:', error instanceof Error ? error.message : error)
      setCategories([])
    }
  }

  const loadCollections = async () => {
    setLoading(true)
    try {
      const results = await searchPublicCollections(
        searchQuery || null,
        selectedCategory,
        sortBy,
        50
      )
      setCollections(results)
    } catch (error) {
      console.error('Error loading collections:', error)
      toast.error('Koleksiyonlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleClone = async (collection: SharedCollection) => {
    if (!user) {
      toast.error('Koleksiyonu kopyalamak için giriş yapın')
      router.push('/login')
      return
    }

    setCloning(collection.id)

    try {
      const newCollectionId = await cloneSharedCollection(
        collection.shareToken,
        user.id
      )
      toast.success('Koleksiyon kopyalandı!')
      router.push(`/collections/${newCollectionId}`)
    } catch (error) {
      console.error('Error cloning collection:', error)
      toast.error('Koleksiyon kopyalanamadı')
    } finally {
      setCloning(null)
    }
  }

  const handleView = (shareToken: string) => {
    router.push(`/shared/${shareToken}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🌍 Topluluk Koleksiyonları
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Diğer kullanıcıların paylaştığı koleksiyonları keşfedin ve kopyalayın
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Koleksiyon ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sırala:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('popular')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sortBy === 'popular'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                🔥 Popüler
              </button>
              <button
                onClick={() => setSortBy('most_cloned')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sortBy === 'most_cloned'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                📋 En Çok Kopyalanan
              </button>
              <button
                onClick={() => setSortBy('recent')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  sortBy === 'recent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                🆕 En Yeni
              </button>
            </div>
          </div>

          {/* Categories */}
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
              {categories.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat.category
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat.category} ({cat.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Collections Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Koleksiyonlar yükleniyor...</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Koleksiyon Bulunamadı
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Farklı bir arama terimi veya filtre deneyin
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
              >
                {/* Header */}
                <div
                  className="p-6 pb-4"
                  style={{ backgroundColor: `${collection.color}20` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                      style={{ backgroundColor: `${collection.color}40` }}
                    >
                      {collection.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {collection.name}
                  </h3>
                  {collection.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {collection.description}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {collection.wordCount}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Kelime</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {collection.viewCount}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Görüntülenme</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {collection.cloneCount}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Kopyalama</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-2">
                  <button
                    onClick={() => handleView(collection.shareToken)}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    👁️ Görüntüle
                  </button>
                  <button
                    onClick={() => handleClone(collection)}
                    disabled={cloning === collection.id}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cloning === collection.id ? '⏳' : '📋'} Kopyala
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
