'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { soundManager } from '@/lib/soundManager'
import { haptics } from '@/lib/haptics'
import { analyzeWord } from '@/lib/aiCategorization'
import { quickLookupWithTranslation } from '@/lib/dictionaryService'
import toast from 'react-hot-toast'

interface AddWordModalProps {
  isOpen: boolean
  onClose: () => void
  onWordAdded?: () => void
}

export default function AddWordModal({ isOpen, onClose, onWordAdded }: AddWordModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [dictionaryLoading, setDictionaryLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    word: '',
    translation: '',
    definition: '',
    example_sentence: '',
    pronunciation_us: '',
    pronunciation_uk: '',
    category: 'daily',
    level: 'B1'
  })

  const categories = [
    { value: 'daily', label: '💬 Günlük Konuşma' },
    { value: 'business', label: '💼 İş İngilizcesi' },
    { value: 'academic', label: '🎓 Akademik' },
    { value: 'technical', label: '⚙️ Teknik' },
    { value: 'travel', label: '✈️ Seyahat' },
    { value: 'food', label: '🍽️ Yemek' },
    { value: 'medical', label: '🏥 Tıbbi' },
    { value: 'legal', label: '⚖️ Hukuki' },
    { value: 'sports', label: '⚽ Spor' },
    { value: 'entertainment', label: '🎬 Eğlence' },
    { value: 'science', label: '🔬 Bilim' },
    { value: 'art', label: '🎨 Sanat' },
    { value: 'politics', label: '🏛️ Politika' },
    { value: 'finance', label: '💰 Finans' },
    { value: 'education', label: '📚 Eğitim' },
    { value: 'technology', label: '💻 Teknoloji' }
  ]

  const levels = [
    { value: 'A1', label: 'A1 - Başlangıç' },
    { value: 'A2', label: 'A2 - Temel' },
    { value: 'B1', label: 'B1 - Orta' },
    { value: 'B2', label: 'B2 - Orta-İleri' },
    { value: 'C1', label: 'C1 - İleri' },
    { value: 'C2', label: 'C2 - Uzman' }
  ]

  // HIZLI SÖZLÜK - Varsayılan
  const handleQuickLookup = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!formData.word.trim()) {
      toast.error('Önce İngilizce kelime girin')
      return
    }

    setDictionaryLoading(true)
    soundManager.playTap()
    haptics.light()

    try {
      console.log('📖 Quick lookup:', formData.word)

      const result = await quickLookupWithTranslation(formData.word.trim())

      console.log('✅ Dictionary result:', result)

      setFormData(prev => ({
        ...prev,
        translation: result.translation,
        definition: result.definition,
        example_sentence: result.example || prev.example_sentence,
        pronunciation_us: result.pronunciation_us || prev.pronunciation_us,
        pronunciation_uk: result.pronunciation_uk || prev.pronunciation_uk,
        category: result.category,
        level: result.level
      }))

      soundManager.playSuccess()
      haptics.success()
      toast.success('📖 Sözlükten hızlıca dolduruldu!')
    } catch (error: unknown) {
      console.error('❌ Dictionary error:', error)
      soundManager.playError()
      haptics.error()
      toast.error(error instanceof Error ? error.message : 'Sözlük hatası')
    } finally {
      setDictionaryLoading(false)
    }
  }

  // AI DETAYLI ANALİZ - Türkçe çeviri zorunlu
  const handleAIAnalysis = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!formData.word.trim()) {
      toast.error('Önce İngilizce kelime girin')
      return
    }

    setAiLoading(true)
    soundManager.playTap()
    haptics.light()

    try {
      console.log('🤖 AI Analysis for:', formData.word)

      const currentTranslation = formData.translation.trim() || 'unknown'

      const analysis = await analyzeWord(
        formData.word.trim(),
        currentTranslation,
        formData.definition.trim() || undefined,
        formData.example_sentence.trim() || undefined
      )

      console.log('✅ AI result:', analysis)

      // Extract Turkish translations
      const turkishTranslations = (analysis.contextualUsage || []).filter((usage: string) => {
        return /[çğıöşüÇĞİÖŞÜ]/.test(usage) || usage.split(' ').length <= 4
      })

      console.log('🇹🇷 Turkish translations:', turkishTranslations)

      const newTranslation = turkishTranslations.length > 0
        ? turkishTranslations.join(', ')
        : (currentTranslation !== 'unknown' ? currentTranslation : 'Çeviri bulunamadı')

      // Create example sentence with translation
      let exampleText = ''
      if (analysis.exampleSentence) {
        exampleText = analysis.exampleSentence
        if (analysis.exampleTranslation) {
          exampleText += ` (${analysis.exampleTranslation})`
        }
      }

      setFormData(prev => ({
        ...prev,
        translation: newTranslation,
        definition: turkishTranslations.join(', ') || prev.definition,
        example_sentence: exampleText || prev.example_sentence,
        category: analysis.categories?.[0]?.category || prev.category,
        level: analysis.level?.level || prev.level
      }))

      soundManager.playSuccess()
      haptics.success()
      toast.success('✨ AI analizi tamamlandı!')
      
    } catch (error) {
      console.error('❌ AI error:', error)
      soundManager.playError()
      haptics.error()
      toast.error('AI analizi başarısız')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Giriş yapmalısınız')
      return
    }

    if (!formData.word.trim()) {
      toast.error('İngilizce kelime zorunludur')
      return
    }

    if (!formData.translation.trim()) {
      toast.error('Önce sözlük veya AI ile doldurun')
      return
    }

    setLoading(true)
    soundManager.playTap()
    haptics.light()

    try {
      const supabase = createClient()
      
      // Bağlantı testi
      const { error: testError } = await supabase
        .from('vocabulary_words')
        .select('id')
        .limit(1)

      if (testError) {
        console.error('❌ Connection test failed:', testError)
        throw new Error('Veritabanı bağlantısı başarısız')
      }

      // set_id gerekliyse varsayılan set al veya oluştur (vocabulary_sets varsa)
      let setId: string | null = null
      try {
        const { data: existingWords } = await supabase
          .from('vocabulary_words')
          .select('set_id')
          .eq('user_id', user.id)
          .limit(1)

        if (existingWords?.[0]?.set_id) {
          setId = existingWords[0].set_id
        } else {
          const { data: sets } = await supabase
            .from('vocabulary_sets')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)

          if (sets?.[0]?.id) {
            setId = sets[0].id
          } else {
            const { data: newSet, error: setError } = await supabase
              .from('vocabulary_sets')
              .insert([{ user_id: user.id, name: 'Kelimelerim', description: 'Varsayılan liste' }])
              .select('id')
              .single()

            if (!setError && newSet?.id) {
              setId = newSet.id
            }
          }
        }
      } catch {
        // vocabulary_sets tablosu yoksa set_id olmadan devam et
      }

      // Veri hazırlama - tüm alanlar doğru tipte
      const wordData: Record<string, unknown> = {
        user_id: user.id,
        word: String(formData.word.trim()),
        translation: String(formData.translation.trim()),
        definition: formData.definition.trim() ? String(formData.definition.trim()) : null,
        example_sentence: formData.example_sentence.trim() ? String(formData.example_sentence.trim()) : null,
        pronunciation: formData.pronunciation_us.trim() || formData.pronunciation_uk.trim() || null,
        pronunciation_us: formData.pronunciation_us.trim() || null,
        pronunciation_uk: formData.pronunciation_uk.trim() || null,
        category: String(formData.category || 'daily'),
        level: String(formData.level || 'B1')
      }

      if (setId) {
        wordData.set_id = setId
      }

      console.log('💾 Inserting word:', wordData)

      const { data, error } = await supabase
        .from('vocabulary_words')
        .insert([wordData])
        .select()

      if (error) {
        const errMsg = typeof error?.message === 'string' ? error.message : String(error)
        const errCode = (error as { code?: string })?.code
        const errDetails = (error as { details?: string })?.details
        const errHint = (error as { hint?: string })?.hint
        
        console.error('❌ Supabase insert error:', errMsg)
        if (errCode) console.error('   Code:', errCode)
        if (errDetails) console.error('   Details:', errDetails)
        if (errHint) console.error('   Hint:', errHint)
        console.error('   Full error keys:', Object.keys(error))
        
        // Özel hata kodları
        if (errCode === '23505') {
          throw new Error('Bu kelime zaten ekli!')
        } else if (errCode === '23503') {
          throw new Error('Kullanıcı hatası. Lütfen yeniden giriş yapın.')
        } else if (errCode === '42501') {
          throw new Error('Yetki hatası. RLS policy kontrol edin.')
        } else if (errCode === '42703' || errMsg.includes('column') || errMsg.includes('sütun')) {
          throw new Error('Veritabanı şeması güncel değil. Supabase migration\'ları çalıştırın.')
        } else {
          throw new Error(errMsg || 'Veritabanı hatası')
        }
      }

      if (!data || data.length === 0) {
        throw new Error('Kelime kaydedilemedi (no data returned)')
      }

      console.log('✅ Word saved:', data[0])

      soundManager.playSuccess()
      haptics.success()
      toast.success('✅ Kelime başarıyla eklendi!')
      
      setFormData({
        word: '',
        translation: '',
        definition: '',
        example_sentence: '',
        pronunciation_us: '',
        pronunciation_uk: '',
        category: 'daily',
        level: 'B1'
      })

      if (onWordAdded) onWordAdded()
      onClose()
      
    } catch (error: unknown) {
      const err = error as { message?: string }
      console.error('❌ Save error:', error)
      soundManager.playError()
      haptics.error()
      toast.error(err?.message || 'Kelime eklenemedi')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between rounded-t-2xl z-10">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                📖 Akıllı Sözlük
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Sadece kelime girin, AI her şeyi doldursun
              </p>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Word Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                İngilizce Kelime <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.word}
                onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                placeholder="örn: ubiquitous, serendipity, resilient"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-lg font-medium"
                autoComplete="off"
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Quick Dictionary */}
              <button
                type="button"
                onClick={handleQuickLookup}
                disabled={dictionaryLoading || !formData.word.trim()}
                className="py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {dictionaryLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sözlük...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">📖</span>
                    <span>Hızlı Sözlük</span>
                  </>
                )}
              </button>

              {/* AI Analysis */}
              <button
                type="button"
                onClick={handleAIAnalysis}
                disabled={aiLoading || !formData.word.trim()}
                className="py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {aiLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>AI Analiz...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">✨</span>
                    <span>AI Detaylı</span>
                  </>
                )}
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div className="text-sm text-blue-900 dark:text-blue-200">
                  <p className="font-semibold mb-1">İki Seçenek:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>📖 Hızlı Sözlük:</strong> Anında sonuç (1-2 saniye)</li>
                    <li>• <strong>✨ AI Detaylı:</strong> Gemini 2.5 ile derin analiz (5-10 saniye)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Translation */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Türkçe Çeviri <span className="text-gray-400">(Otomatik doldurulur)</span>
              </label>
              <input
                type="text"
                value={formData.translation}
                onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
                placeholder="Sözlük veya AI ile otomatik dolacak..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>

            {/* Definition */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Tanım <span className="text-gray-400">(Opsiyonel)</span>
              </label>
              <textarea
                value={formData.definition}
                onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                placeholder="Otomatik dolacak veya kendiniz ekleyin..."
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
              />
            </div>

            {/* Example */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Örnek Cümle <span className="text-gray-400">(Opsiyonel)</span>
              </label>
              <textarea
                value={formData.example_sentence}
                onChange={(e) => setFormData({ ...formData, example_sentence: e.target.value })}
                placeholder="İsterseniz kendiniz ekleyin..."
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
              />
            </div>

            {/* Category & Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Seviye
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer"
                >
                  {levels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading || !formData.word.trim() || !formData.translation.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Kaydediliyor...
                  </span>
                ) : (
                  '✅ Kelimeyi Kaydet'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
