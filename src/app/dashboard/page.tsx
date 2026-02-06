'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import MetricCard from '@/components/MetricCard'
import AddWordModal from '@/components/AddWordModal'
import DarkModeToggle from '@/components/DarkModeToggle'
import { motion } from 'framer-motion'
import {
  BookOpen,
  TrendingUp,
  Target,
  Calendar,
  Award,
  Zap,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getWords, getStats, getSettings } from '@/lib/storage'

interface SupabaseWord {
  id: string
  word: string
  translation: string
  mastery_level?: number
  last_reviewed_at?: string | null
  created_at?: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [showAddWordModal, setShowAddWordModal] = useState(false)
  const [stats, setStats] = useState({
    totalWords: 0,
    learned: 0,
    todayStudied: 0,
    streak: 0,
    todayGoal: 10,
    weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
    recentWords: [] as { word: string; translation: string; status: string }[],
    achievements: [
      { title: '7 Gün Seri', icon: '🔥', unlocked: false },
      { title: '50 Kelime', icon: '📚', unlocked: false },
      { title: '100 Kelime', icon: '🎯', unlocked: false },
      { title: 'Mükemmel Hafta', icon: '⭐', unlocked: false },
    ],
  })

  const fetchWords = useCallback(async () => {
    const userStats = getStats()
    const settings = getSettings()
    let words: { word: string; translation: string; progress: number; lastReviewed?: number }[] = []

    if (user) {
      // Giriş yapılmışsa Supabase'den çek
      const supabase = createClient()
      const { data } = await supabase
        .from('vocabulary_words')
        .select('id, word, translation, mastery_level, last_reviewed_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        words = data.map((w: SupabaseWord) => ({
          word: w.word,
          translation: w.translation,
          progress: w.mastery_level ?? 0,
          lastReviewed: w.last_reviewed_at
            ? new Date(w.last_reviewed_at).getTime()
            : undefined,
        }))
      }
    } else {
      // Giriş yoksa localStorage'dan çek
      const stored = getWords()
      words = stored.map((w: { word: string; translation: string; progress: number; lastReviewed?: number }) => ({
        word: w.word,
        translation: w.translation,
        progress: w.progress,
        lastReviewed: w.lastReviewed,
      }))
    }

    const weeklyProgress = Array(7).fill(0)
    const today = new Date()

    words.forEach((word) => {
      if (word.lastReviewed) {
        const reviewDate = new Date(word.lastReviewed)
        const diffDays = Math.floor(
          (today.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (diffDays < 7) {
          weeklyProgress[6 - diffDays]++
        }
      }
    })

    const recentWords = words
      .filter((w) => w.lastReviewed)
      .sort((a, b) => (b.lastReviewed || 0) - (a.lastReviewed || 0))
      .slice(0, 4)
      .map((w) => ({
        word: w.word,
        translation: w.translation,
        status:
          w.progress >= 80 ? 'learned' : w.progress >= 40 ? 'learning' : 'new',
      }))

    // Son eklenen kelimeler (created_at yoksa tüm kelimelerden ilk 4)
    const fallbackRecent = words.slice(0, 4).map((w) => ({
      word: w.word,
      translation: w.translation,
      status:
        w.progress >= 80 ? 'learned' : w.progress >= 40 ? 'learning' : 'new',
    }))
    const finalRecent = recentWords.length > 0 ? recentWords : fallbackRecent

    const achievements = [
      { title: '7 Gün Seri', icon: '🔥', unlocked: userStats.streak >= 7 },
      { title: '50 Kelime', icon: '📚', unlocked: words.length >= 50 },
      { title: '100 Kelime', icon: '🎯', unlocked: words.length >= 100 },
      {
        title: 'Mükemmel Hafta',
        icon: '⭐',
        unlocked: weeklyProgress.every((d: number) => d >= settings.dailyGoal),
      },
    ]

    setStats({
      totalWords: words.length,
      learned: words.filter((w) => w.progress >= 80).length,
      todayStudied: weeklyProgress[6],
      streak: userStats.streak,
      todayGoal: settings.dailyGoal,
      weeklyProgress,
      recentWords: finalRecent,
      achievements,
    })
  }, [user])

  useEffect(() => {
    fetchWords()
  }, [fetchWords])

  const todayProgress = Math.round(
    (stats.todayStudied / stats.todayGoal) * 100
  )
  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Kullanıcı'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hoşgeldin + Dark Mode Toggle */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">
            Merhaba, {userName}! 👋
          </h1>
          <p className="text-slate-600 dark:text-gray-400">
            {stats.todayStudied > 0
              ? `Bugün ${stats.todayStudied} kelime çalıştınız. Harika gidiyorsunuz!`
              : 'Bugün henüz çalışma yapmadınız. Hadi başlayalım! 🚀'}
          </p>
        </div>
        <DarkModeToggle compact={true} />
      </div>

      {/* Metrikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          icon={BookOpen}
          label="Toplam Kelime"
          value={stats.totalWords}
          gradient="blue"
        />
        <MetricCard
          icon={Award}
          label="Öğrenilen"
          value={stats.learned}
          subtitle={
            stats.totalWords > 0
              ? `%${Math.round((stats.learned / stats.totalWords) * 100)} tamamlandı`
              : ''
          }
          gradient="green"
        />
        <MetricCard
          icon={Zap}
          label="Bugün"
          value={stats.todayStudied}
          subtitle={`Hedef: ${stats.todayGoal}`}
          gradient="amber"
        />
        <MetricCard
          icon={Calendar}
          label="Seri"
          value={`${stats.streak} gün`}
          subtitle={stats.streak > 0 ? '🔥 Devam ediyor!' : 'Başlayın!'}
          gradient="purple"
        />
      </div>

      {/* Günlük Hedef */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Target size={24} className="text-blue-600" />
            Günlük Hedef
          </h2>
          <span className="text-2xl font-bold text-blue-600">
            {stats.todayStudied}/{stats.todayGoal}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
            style={{ width: `${Math.min(todayProgress, 100)}%` }}
          >
            {todayProgress >= 20 && (
              <span className="text-xs font-bold text-white">%{todayProgress}</span>
            )}
          </div>
        </div>
        {todayProgress >= 100 ? (
          <p className="text-sm text-green-600 font-semibold flex items-center gap-1">
            <CheckCircle size={16} />
            Günlük hedefinizi tamamladınız! 🎉
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            Hedefe ulaşmak için{' '}
            {Math.max(0, stats.todayGoal - stats.todayStudied)} kelime daha!
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Haftalık Aktivite */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Haftalık Aktivite</h2>
            <Link
              href="/statistics"
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              Detaylar
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="h-48 flex items-end justify-around gap-2">
            {stats.weeklyProgress.map((count, i) => {
              const maxCount = Math.max(...stats.weeklyProgress, 1)
              const height = (count / maxCount) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full group">
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-700 hover:to-blue-500 cursor-pointer"
                      style={{ height: `${Math.max(height * 1.5, 10)}px` }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {count} kelime
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][i]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Son Kelimeler */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Son Kelimeler</h2>
            <Link
              href="/vocabulary"
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              Tümü
              <ArrowRight size={16} />
            </Link>
          </div>
          {stats.recentWords.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="mb-2">Henüz kelime çalışmadınız</p>
              <Link
                href="/flashcards"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Hemen başlayın! →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentWords.map((item, i) => {
                const statusConfig = {
                  learned: {
                    bg: 'bg-green-50',
                    text: 'text-green-700',
                    label: 'Öğrenildi',
                    icon: '✅',
                  },
                  learning: {
                    bg: 'bg-blue-50',
                    text: 'text-blue-700',
                    label: 'Öğreniliyor',
                    icon: '📖',
                  },
                  new: {
                    bg: 'bg-amber-50',
                    text: 'text-amber-700',
                    label: 'Yeni',
                    icon: '✨',
                  },
                }
                const config =
                  statusConfig[item.status as keyof typeof statusConfig] ||
                  statusConfig.new
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {item.word}
                      </h3>
                      <p className="text-sm text-slate-600">{item.translation}</p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full ${config.bg} ${config.text} font-medium`}
                    >
                      {config.icon} {config.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Başarımlar */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6">
          🏆 Başarımlar
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.achievements.map((achievement, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                achievement.unlocked
                  ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300 shadow-sm'
                  : 'bg-slate-50 border-slate-200 opacity-50'
              }`}
            >
              <div className="text-4xl mb-2">{achievement.icon}</div>
              <h3 className="text-sm font-semibold text-slate-800">
                {achievement.title}
              </h3>
              {achievement.unlocked && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  Kazanıldı!
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hızlı Aksiyonlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddWordModal(true)}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <span className="text-xl">➕</span>
          <span>Yeni Kelime Ekle</span>
        </motion.button>
        <Link
          href="/flashcards"
          className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <h3 className="text-lg font-bold mb-2">📚 Flashcard Çalış</h3>
          <p className="text-sm opacity-90">Kelimelerinizi tekrar edin</p>
        </Link>
        <Link
          href="/vocabulary"
          className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <h3 className="text-lg font-bold mb-2">📖 Sözlük</h3>
          <p className="text-sm opacity-90">Tüm kelimelerinizi görün</p>
        </Link>
        {/* Statistics Card */}
        <Link
          href="/statistics"
          className="rounded-xl border border-stone-200 bg-white p-6 shadow-lg hover:border-purple-500 hover:shadow-xl transition-all group dark:bg-gray-900 dark:border-gray-800"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📊
            </div>
            <svg
              className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-purple-600 transition-colors dark:text-white dark:group-hover:text-purple-400">
            İstatistikler
          </h3>
          <p className="text-slate-600 text-sm dark:text-gray-400">
            İlerlemenizi takip edin
          </p>
        </Link>
      </div>

      {/* Add Word Modal */}
      <AddWordModal
        isOpen={showAddWordModal}
        onClose={() => setShowAddWordModal(false)}
        onWordAdded={() => {
          fetchWords()
        }}
      />
    </div>
  )
}
