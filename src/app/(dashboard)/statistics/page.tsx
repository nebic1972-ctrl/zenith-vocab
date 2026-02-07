'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import {
  getVocabularyStatistics,
  getAllCollectionsStatistics,
  getReviewStats,
  getLevelColor,
  getMasteryColor,
  type VocabularyStatistics,
  type CollectionStats
} from '@/lib/statisticsService'
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'

export default function StatisticsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<VocabularyStatistics | null>(null)
  const [collectionStats, setCollectionStats] = useState<CollectionStats[]>([])
  const [reviewStats, setReviewStats] = useState<Awaited<ReturnType<typeof getReviewStats>> | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (!user?.id) return

    loadStatistics(user.id)
  }, [user, authLoading, router])

  const loadStatistics = async (userId: string) => {
    setLoading(true)
    try {
      const [vocabStats, collStats, revStats] = await Promise.all([
        getVocabularyStatistics(userId),
        getAllCollectionsStatistics(userId),
        getReviewStats(userId)
      ])
      setStats(vocabStats)
      setCollectionStats(collStats)
      setReviewStats(revStats)
    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || (!user && !authLoading) || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">İstatistikler yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">İstatistik bulunamadı</p>
        </div>
      </div>
    )
  }

  const levelData = Object.entries(stats.wordsByLevel).map(([level, count]) => ({
    name: level,
    value: count,
    color: getLevelColor(level)
  }))

  const categoryData = Object.entries(stats.wordsByCategory).map(([category, count]) => ({
    name: category,
    count
  }))

  const masteryData = Object.entries(stats.wordsByMastery).map(([level, count]) => ({
    name: `Seviye ${level}`,
    count,
    color: getMasteryColor(Number(level))
  }))

  const activityData = [...stats.recentActivity]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)

  const tooltipStyle = {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '8px'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            📊 İstatistikler
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Öğrenme ilerlemenizi takip edin
          </p>
        </motion.div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl">📚</span>
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalWords}
              </span>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 font-medium">Toplam Kelime</h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl">📁</span>
              <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {stats.totalCollections}
              </span>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 font-medium">Koleksiyon</h3>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl">🔥</span>
              <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {stats.streak}
              </span>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 font-medium">Günlük Seri</h3>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              En uzun: {stats.longestStreak} gün
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl">⭐</span>
              <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.averageMastery.toFixed(1)}
              </span>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 font-medium">Ortalama Seviye</h3>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${(stats.averageMastery / 5) * 100}%` }}
              />
            </div>
          </motion.div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Level Distribution */}
          {levelData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Seviye Dağılımı
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={levelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {levelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Category Distribution */}
          {categoryData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Kategori Dağılımı
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Mastery Distribution */}
          {masteryData.some((d) => d.count > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Öğrenme Seviyesi
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={masteryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {masteryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Son 14 Gün Aktivitesi */}
          {activityData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Son 14 Gün Aktivitesi
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit'
                      })
                    }
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(date) => new Date(date).toLocaleDateString('tr-TR')}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="wordsAdded"
                    stroke="#3b82f6"
                    name="Eklenen Kelimeler"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Haftalık tekrar */}
          {reviewStats && reviewStats.weeklyData.some((d) => d.count > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Haftalık Tekrar Dağılımı
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reviewStats.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Tekrar" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>

        {/* Collection Stats */}
        {collectionStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Koleksiyon Performansı
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">
                      Koleksiyon
                    </th>
                    <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">
                      Kelime Sayısı
                    </th>
                    <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">
                      Ortalama Seviye
                    </th>
                    <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">
                      Tamamlanma
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {collectionStats.map((collection) => (
                    <tr
                      key={collection.collectionId}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                        {collection.collectionName}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">
                        {collection.wordCount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1">
                          <span className="text-gray-900 dark:text-white font-medium">
                            {collection.averageMastery.toFixed(1)}
                          </span>
                          <span className="text-gray-400">/5</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all"
                              style={{ width: `${collection.completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem] text-right">
                            {collection.completionRate.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Boş durum */}
        {stats.totalWords === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 px-6 rounded-xl border border-dashed border-gray-600 bg-gray-900/50"
          >
            <p className="text-gray-400 text-center">
              Kelime ekleyip tekrar yaptıkça istatistikleriniz burada görünecek.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
