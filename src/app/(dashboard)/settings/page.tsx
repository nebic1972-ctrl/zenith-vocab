'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  getUserPreferences,
  updateUserPreferences,
  formatReminderTimeForInput,
  type UserPreferences
} from '@/lib/preferencesService'
import { useAuth } from '@/contexts/AuthContext'

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.id) {
      loadPreferences()
    }
  }, [user?.id])

  const loadPreferences = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const prefs = await getUserPreferences(user.id)
      setPreferences(prefs)
    } catch (error) {
      console.error('Error loading preferences:', error)
      toast.error('Ayarlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user?.id || !preferences) return

    setSaving(true)
    try {
      await updateUserPreferences(user.id, {
        emailNotificationsEnabled: preferences.emailNotificationsEnabled,
        dailyReminderEnabled: preferences.dailyReminderEnabled,
        reminderTime: preferences.reminderTime,
        reminderTimezone: preferences.reminderTimezone,
        weeklyReportEnabled: preferences.weeklyReportEnabled,
        achievementNotifications: preferences.achievementNotifications
      })
      toast.success('Ayarlar kaydedildi')
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Ayarlar kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (loading || !preferences) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Ayarlar yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            ⚙️ Ayarlar
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bildirim ve tercihlerinizi yönetin
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
          {/* Email Notifications */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📧 E-posta Bildirimleri
            </h2>

            <div className="space-y-4">
              <label className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    E-posta bildirimleri
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Tüm e-posta bildirimlerini aç/kapat
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.emailNotificationsEnabled}
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      emailNotificationsEnabled: !preferences.emailNotificationsEnabled
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                    preferences.emailNotificationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Günlük hatırlatma
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Vadesi gelen kelimeler için günlük e-posta
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.dailyReminderEnabled}
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      dailyReminderEnabled: !preferences.dailyReminderEnabled
                    })
                  }
                  disabled={!preferences.emailNotificationsEnabled}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    preferences.dailyReminderEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.dailyReminderEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              {preferences.dailyReminderEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hatırlatma saati
                  </label>
                  <input
                    type="time"
                    value={formatReminderTimeForInput(preferences.reminderTime)}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        reminderTime: e.target.value
                      })
                    }
                    className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <label className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Haftalık rapor
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Haftalık ilerleme raporu
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.weeklyReportEnabled}
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      weeklyReportEnabled: !preferences.weeklyReportEnabled
                    })
                  }
                  disabled={!preferences.emailNotificationsEnabled}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    preferences.weeklyReportEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.weeklyReportEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>

          {/* Other Notifications */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🔔 Diğer Bildirimler
            </h2>

            <div className="space-y-4">
              <label className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Başarı bildirimleri
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Rozetler ve başarılar için bildirim
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.achievementNotifications}
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      achievementNotifications: !preferences.achievementNotifications
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                    preferences.achievementNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.achievementNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '⏳ Kaydediliyor...' : '💾 Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
