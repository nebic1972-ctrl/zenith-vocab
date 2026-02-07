import { createClient } from '@/lib/supabase/client'

export interface UserPreferences {
  id: string
  userId: string
  emailNotificationsEnabled: boolean
  dailyReminderEnabled: boolean
  reminderTime: string
  reminderTimezone: string
  pushNotificationsEnabled: boolean
  weeklyReportEnabled: boolean
  achievementNotifications: boolean
}

const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id'> = {
  userId: '',
  emailNotificationsEnabled: true,
  dailyReminderEnabled: true,
  reminderTime: '09:00:00',
  reminderTimezone: 'Europe/Istanbul',
  pushNotificationsEnabled: false,
  weeklyReportEnabled: true,
  achievementNotifications: true
}

/**
 * Get user preferences (creates if not exists)
 * RPC veya tablo yoksa varsayılan tercihler döner
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('get_user_preferences', {
    p_user_id: userId
  })

  if (error) {
    console.warn('get_user_preferences RPC failed (migration may not be run):', error.message)
    return {
      id: '',
      ...DEFAULT_PREFERENCES,
      userId
    }
  }

  const prefs = data?.[0]
  if (!prefs) {
    return {
      id: '',
      ...DEFAULT_PREFERENCES,
      userId
    }
  }

  return {
    id: prefs.id,
    userId: prefs.user_id,
    emailNotificationsEnabled: prefs.email_notifications_enabled ?? true,
    dailyReminderEnabled: prefs.daily_reminder_enabled ?? true,
    reminderTime: prefs.reminder_time ?? '09:00:00',
    reminderTimezone: prefs.reminder_timezone ?? 'Europe/Istanbul',
    pushNotificationsEnabled: prefs.push_notifications_enabled ?? false,
    weeklyReportEnabled: prefs.weekly_report_enabled ?? true,
    achievementNotifications: prefs.achievement_notifications ?? true
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  updates: Partial<Omit<UserPreferences, 'id' | 'userId'>>
): Promise<void> {
  const supabase = createClient()

  const dbUpdates: Record<string, unknown> = {}

  if (updates.emailNotificationsEnabled !== undefined) {
    dbUpdates.email_notifications_enabled = updates.emailNotificationsEnabled
  }
  if (updates.dailyReminderEnabled !== undefined) {
    dbUpdates.daily_reminder_enabled = updates.dailyReminderEnabled
  }
  if (updates.reminderTime !== undefined) {
    const t = String(updates.reminderTime)
    dbUpdates.reminder_time = t.split(':').length === 2 ? `${t}:00` : t
  }
  if (updates.reminderTimezone !== undefined) {
    dbUpdates.reminder_timezone = updates.reminderTimezone
  }
  if (updates.pushNotificationsEnabled !== undefined) {
    dbUpdates.push_notifications_enabled = updates.pushNotificationsEnabled
  }
  if (updates.weeklyReportEnabled !== undefined) {
    dbUpdates.weekly_report_enabled = updates.weeklyReportEnabled
  }
  if (updates.achievementNotifications !== undefined) {
    dbUpdates.achievement_notifications = updates.achievementNotifications
  }

  const { error } = await supabase
    .from('user_preferences')
    .update(dbUpdates)
    .eq('user_id', userId)

  if (error) throw error
}

/** reminder_time "09:00:00" → input[type="time"] için "09:00" */
export function formatReminderTimeForInput(time: string): string {
  if (!time) return '09:00'
  const parts = String(time).split(':')
  return `${parts[0] || '09'}:${parts[1] || '00'}`
}
