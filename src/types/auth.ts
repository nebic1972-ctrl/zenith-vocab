/**
 * ZENITH-Vocab Auth TypeScript Types
 * User metadata ve onboarding için tip tanımları
 */

export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export type DailyWordGoal = 5 | 10 | 20 | 50

export interface UserMetadata {
  onboarding_completed?: boolean
  first_login_at?: string
  language_level?: LanguageLevel
  daily_word_goal?: DailyWordGoal
}

export interface AuthError {
  code: string
  message: string
}
