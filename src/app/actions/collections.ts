'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Initialize template collections (Server Action with service role)
 */
export async function initializeTemplateCollections() {
  const supabase = await createClient()

  // Check if templates already exist
  const { data: existing } = await supabase
    .from('collections')
    .select('id')
    .eq('is_template', true)
    .limit(1)

  if (existing && existing.length > 0) {
    return { success: true, message: 'Templates already exist' }
  }

  // Get system user (first admin or create a system user)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'No authenticated user' }
  }

  const templates = [
    {
      name: 'Günlük İngilizce',
      description: 'Günlük hayatta sık kullanılan temel kelimeler',
      icon: '🌟',
      color: 'blue',
      is_template: true,
      is_public: true,
      user_id: user.id // Use actual user ID
    },
    {
      name: 'İş İngilizcesi',
      description: 'İş hayatında kullanılan profesyonel kelimeler',
      icon: '💼',
      color: 'indigo',
      is_template: true,
      is_public: true,
      user_id: user.id
    },
    {
      name: 'Seyahat',
      description: 'Seyahat ederken işinize yarayacak kelimeler',
      icon: '✈️',
      color: 'cyan',
      is_template: true,
      is_public: true,
      user_id: user.id
    },
    {
      name: 'Yemek & Mutfak',
      description: 'Yemek ve mutfakla ilgili kelimeler',
      icon: '🍕',
      color: 'orange',
      is_template: true,
      is_public: true,
      user_id: user.id
    },
    {
      name: 'Teknoloji',
      description: 'Teknoloji ve bilgisayar terimleri',
      icon: '💻',
      color: 'purple',
      is_template: true,
      is_public: true,
      user_id: user.id
    },
    {
      name: 'Sağlık',
      description: 'Sağlık ve tıbbi terimler',
      icon: '🏥',
      color: 'red',
      is_template: true,
      is_public: true,
      user_id: user.id
    },
    {
      name: 'Eğitim',
      description: 'Eğitim ve akademik kelimeler',
      icon: '📚',
      color: 'green',
      is_template: true,
      is_public: true,
      user_id: user.id
    },
    {
      name: 'Spor',
      description: 'Spor ve fitness kelimeleri',
      icon: '⚽',
      color: 'yellow',
      is_template: true,
      is_public: true,
      user_id: user.id
    }
  ]

  const { error } = await supabase
    .from('collections')
    .insert(templates)

  if (error) {
    console.error('Error creating templates:', error)
    return { success: false, error: error.message }
  }

  return { success: true, message: 'Templates created successfully' }
}
