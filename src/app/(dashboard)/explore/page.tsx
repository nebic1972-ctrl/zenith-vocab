'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import {
  searchPublicCollections,
  getCollectionCategories,
  cloneSharedCollection,
  generateShareUrl
} from '@/lib/sharingService'
import type { SharedCollection } from '@/lib/sharingService'
import { Search, Compass, Eye, Copy, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const colorClasses: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
  indigo: 'from-indigo-500 to-indigo-600',
  orange: 'from-orange-500 to-orange-600',
  cyan: 'from-cyan-500 to-cyan-600',
  red: 'from-red-500 to-red-600',
  yellow: 'from-yellow-500 to-yellow-600',
  pink: 'from-pink-500 to-pink-600',
  teal: 'from-teal-500 to-teal-600'
}

function ExploreCard({
  collection,
  onView,
  onClone,
  onCopyLink,
  cloning
}: {
  collection: SharedCollection
  onView: () => void
  onClone: () => void
  onCopyLink: () => void
  cloning?: boolean
}) {
  const gradientClass = colorClasses[collection.color as keyof typeof colorClasses] || colorClasses.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${gradientClass} rounded-xl p-6 text-white shadow-lg relative overflow-hidden`}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -mr-12 -mt-12" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white rounded-full -ml-10 -mb-10" />
      </div>

      <div className="relative z-10">
        <div className="text-5xl mb-3">{collection.icon}</div>
        <h3 className="text-xl font-bold mb-2">{collection.name}</h3>
        <p className="text-white/80 text-sm mb-4 line-clamp-2">
          {collection.description || 'Açıklama yok'}
        </p>

        <div className="flex items-center gap-4 text-sm mb-4">
          <span>📚 {collection.wordCount} kelime</span>
          <span>👁️ {collection.viewCount} görüntülenme</span>
          <span>📋 {collection.cloneCount} kopyalama</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onView}
            className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            <Eye size={18} />
            Görüntüle
          </button>
          <button
            onClick={onClone}
            disabled={cloning}
            className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            {cloning ? 'Kopyalanıyor...' : 'Kopyala'}
          </button>
          <button
            onClick={onCopyLink}
            className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors"
            title="Linki kopyala"
          >
            <Copy size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function ExplorePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [collections, setCollections] = useState<SharedCollection[]>([])
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [cloningId, setCloningId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'most_cloned'>('popular')

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadCollections()
  }, [query, category, sortBy])

  const loadCategories = async () => {
    try {
      const data = await getCollectionCategories()
      setCategories(data)
    } catch (error) {
      console.error('Categories load error:', error)
    }
  }

  const loadCollections = async () => {
    setLoading(true)
    try {
      const data = await searchPublicCollections(
        query || null,
        category,
        sortBy,
        24,
        0
      )
      setCollections(data)
    } catch (error) {
      console.error('Explore load error:', error)
      toast.error('Koleksiyonlar yüklenemedi')
      setCollections([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setQuery(searchInput.trim() || '')
  }

  const handleView = (token: string) => {
    router.push(`/shared/${token}`)
  }

  const handleClone = async (token: string) => {
    if (!user) {
      router.push(`/login?returnUrl=${encodeURIComponent('/explore')}`)
      return
    }

    setCloningId(token)
    try {
      const collectionId = await cloneSharedCollection(token, user.id)
      toast.success('Koleksiyon hesabınıza kopyalandı!')
      router.push(`/collections/${collectionId}`)
    } catch (error) {
      console.error('Clone error:', error)
      toast.error('Koleksiyon kopyalanamadı')
    } finally {
      setCloningId(null)
    }
  }

  const handleCopyLink = async (token: string) => {
    const url = generateShareUrl(token)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link kopyalandı!')
    } catch {
      toast.error('Link kopyalanamadı')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2 mb-2">
            <Compass size={28} />
            Keşfet
          </h1>
          <p className="text-gray-400">
            Topluluk tarafından paylaşılan koleksiyonları keşfedin ve kendi sözlüğünüze ekleyin
          </p>
        </header>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                size={20}
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Koleksiyon ara..."
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
            >
              Ara
            </button>
          </form>

          <div className="flex flex-wrap gap-3">
            <select
              value={category || ''}
              onChange={(e) => setCategory(e.target.value || null)}
              className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm kategoriler</option>
              {categories.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.category} ({cat.count})
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="popular">Popüler</option>
              <option value="recent">En yeni</option>
              <option value="most_cloned">En çok kopyalanan</option>
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">Koleksiyon bulunamadı</h3>
            <p className="text-gray-400 mb-4">
              Arama kriterlerinizi değiştirmeyi deneyin veya kendi koleksiyonunuzu paylaşın
            </p>
            <button
              onClick={() => {
                setQuery('')
                setSearchInput('')
                setCategory(null)
                loadCollections()
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Filtreleri Temizle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <ExploreCard
                key={collection.id}
                collection={collection}
                onView={() => handleView(collection.shareToken)}
                onClone={() => handleClone(collection.shareToken)}
                onCopyLink={() => handleCopyLink(collection.shareToken)}
                cloning={cloningId === collection.shareToken}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
