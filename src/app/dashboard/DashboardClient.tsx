'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useAuth } from '@/contexts/AuthContext'
import { BookOpen, Target, Flame, Plus, LogOut } from 'lucide-react'

interface DashboardClientProps {
  user: User
  profile: any
  vocabularySets: any[]
  totalWords: number
}

export default function DashboardClient({
  user,
  profile,
  vocabularySets,
  totalWords,
}: DashboardClientProps) {
  const { signOut } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Çıkış hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Zenith Vocab
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Hoş geldiniz</p>
              <p className="text-sm font-medium text-gray-900">
                {profile?.full_name || user.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Hoş Geldiniz! 👋
          </h2>
          <p className="text-gray-600">
            Bugün hangi kelimeleri öğrenmek istersiniz?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Kelime Setleri */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Setler
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Kelime Setleri</h3>
            <p className="text-3xl font-bold text-gray-900">{vocabularySets.length}</p>
          </div>

          {/* Card 2: Toplam Kelime */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                Kelimeler
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Toplam Kelime</h3>
            <p className="text-3xl font-bold text-gray-900">{totalWords}</p>
          </div>

          {/* Card 3: Günlük Seri */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                Streak
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Günlük Seri</h3>
            <p className="text-3xl font-bold text-gray-900">0 gün</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Hızlı İşlemler</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Yeni Set Oluştur</p>
                <p className="text-sm text-gray-500">Kelime seti ekle</p>
              </div>
            </button>

            <button className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Çalışmaya Başla</p>
                <p className="text-sm text-gray-500">Kelimeleri tekrar et</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Sets */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Kelime Setlerim</h3>
          {vocabularySets.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Henüz kelime setiniz yok</p>
              <button className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all">
                <Plus className="w-5 h-5" />
                İlk Setinizi Oluşturun
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vocabularySets.map((set) => (
                <div
                  key={set.id}
                  className="p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                >
                  <h4 className="font-semibold text-gray-900 mb-1">{set.name}</h4>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {set.description || 'Açıklama yok'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>0 kelime</span>
                    <span className="uppercase font-medium">{set.language}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
