'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { copyCollectionToUser } from '@/lib/collectionsService'

interface SharedCollectionClientProps {
  token: string
}

interface Collection {
  id: string
  name: string
  description: string | null
  icon: string
  color: string
  user_id: string
  is_public: boolean
  words: Array<{
    id: string
    word: string
    translation: string | null
    definition: string | null
    level: string
    category: string | null
  }>
}

export default function SharedCollectionClient({ token }: SharedCollectionClientProps) {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    loadCollection()
  }, [token])

  const checkUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadCollection = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data: collectionData, error: collectionError } = await supabase
        .from('collections')
        .select('*')
        .eq('share_token', token)
        .eq('share_enabled', true)
        .single()

      if (collectionError || !collectionData) {
        toast.error('Koleksiyon bulunamadı')
        router.push('/explore')
        return
      }

      const { data: wordsData, error: wordsError } = await supabase
        .from('collection_words')
        .select(`
          word_id,
          vocabulary_words (
            id,
            word,
            translation,
            definition,
            level,
            category
          )
        `)
        .eq('collection_id', collectionData.id)

      if (wordsError) throw wordsError

      const words = (wordsData || [])
        .map((item: { vocabulary_words?: Record<string, unknown> | null }) => item.vocabulary_words)
        .filter(Boolean) as Collection['words']

      setCollection({
        ...collectionData,
        words
      })
    } catch (error) {
      console.error('Error loading collection:', error)
      toast.error('Koleksiyon yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!user) {
      toast.error('Koleksiyonu kopyalamak için giriş yapmalısınız')
      router.push('/login')
      return
    }

    if (!collection) return

    setCopying(true)
    try {
      await copyCollectionToUser(collection.id, user.id)
      toast.success('Koleksiyon kopyalandı!')
      router.push('/collections')
    } catch (error) {
      console.error('Error copying collection:', error)
      toast.error('Koleksiyon kopyalanamadı')
    } finally {
      setCopying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Koleksiyon yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Koleksiyon Bulunamadı
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Bu koleksiyon artık mevcut değil veya paylaşımı kapatılmış.
          </p>
          <button
            onClick={() => router.push('/explore')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all"
          >
            Diğer Koleksiyonları Keşfet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${collection.color}20` }}
              >
                {collection.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {collection.name}
                </h1>
                {collection.description && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {collection.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
            <span>📚 {collection.words.length} kelime</span>
            {collection.is_public && <span>🌍 Herkese açık</span>}
          </div>

          <button
            onClick={handleCopy}
            disabled={copying}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copying ? '⏳ Kopyalanıyor...' : '📋 Koleksiyonu Kopyala'}
          </button>
        </motion.div>

        <div className="space-y-4">
          {collection.words.map((word, index) => (
            <motion.div
              key={word.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
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
                <p className="text-gray-600 dark:text-gray-400">
                  {word.definition}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
