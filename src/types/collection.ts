export interface Collection {
  id: string
  user_id: string
  name: string
  description: string | null
  icon: string
  color: string
  is_public: boolean
  is_template: boolean
  created_at: string
  updated_at: string
  word_count?: number
  learned_count?: number
  progress_percentage?: number
  share_enabled?: boolean
  share_token?: string | null
}

export interface CollectionWord {
  id: string
  collection_id: string
  word_id: string
  added_at: string
}

export interface CollectionWithWords extends Collection {
  words: Array<{
    id: string
    word: string
    translation: string
    level: string
    category: string
    mastery_level: number
  }>
}

export interface VocabularyWord {
  id: string
  word: string
  translation: string
  definition?: string | null
  example_sentence?: string | null
  pronunciation_us?: string | null
  pronunciation_uk?: string | null
  category?: string
  level?: string
  mastery_level: number
  last_reviewed_at?: string | null
  next_review_at?: string | null
  review_count?: number
  created_at: string
}

export const COLLECTION_COLORS = [
  'blue', 'green', 'purple', 'indigo', 'orange', 
  'cyan', 'red', 'yellow', 'pink', 'teal'
] as const

export const COLLECTION_ICONS = [
  '📚', '💼', '✈️', '📝', '🎓', '💬', '💻', 
  '⚕️', '🍳', '⚽', '🎵', '🎨', '🔬', '⚖️'
] as const

export type CollectionColor = typeof COLLECTION_COLORS[number]
export type CollectionIcon = typeof COLLECTION_ICONS[number]
