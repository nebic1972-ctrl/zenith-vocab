'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getDueWordsCount } from '@/lib/spacedRepetitionService'

export default function DueWordsWidget() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [dueCount, setDueCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadDueCount()
    }
  }, [user])

  const checkUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadDueCount = async () => {
    if (!user) return
    
    try {
      const count = await getDueWordsCount(user.id)
      setDueCount(count)
    } catch (error) {
      console.error('Error loading due count:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">🧠 Bugün Tekrar Et</h3>
            <p className="text-white/80 text-sm">
              {dueCount === 0 
                ? 'Tebrikler! Bugün için tekrar yok.' 
                : `${dueCount} kelime seni bekliyor`
              }
            </p>
          </div>
          <div className="text-5xl font-bold">
            {dueCount}
          </div>
        </div>
        
        {dueCount > 0 && (
          <button
            onClick={() => router.push('/study')}
            className="w-full px-4 py-3 bg-white hover:bg-gray-100 text-blue-600 rounded-lg font-semibold transition-all hover:scale-105"
          >
            🚀 Çalışmaya Başla
          </button>
        )}
        
        {dueCount === 0 && (
          <button
            onClick={() => router.push('/vocabulary')}
            className="w-full px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors"
          >
            ➕ Yeni Kelime Ekle
          </button>
        )}
      </div>
    </div>
  )
}
