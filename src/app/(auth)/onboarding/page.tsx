'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import type { LanguageLevel, DailyWordGoal } from '@/types/auth'

const STEPS = [
  { id: 0, title: 'Hoş geldiniz!' },
  { id: 1, title: 'Dil Seviyeniz' },
  { id: 2, title: 'Günlük Hedef' },
  { id: 3, title: 'Tamamlandı!' },
]

const LANGUAGE_LEVELS: LanguageLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const DAILY_GOALS: DailyWordGoal[] = [5, 10, 20, 50]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [languageLevel, setLanguageLevel] = useState<LanguageLevel>('B1')
  const [dailyGoal, setDailyGoal] = useState<DailyWordGoal>(10)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (user.user_metadata?.onboarding_completed) {
      router.replace('/')
    }
  }, [user, authLoading, router])

  const handleComplete = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const metadata = user.user_metadata ?? {}
      await supabase.auth.updateUser({
        data: {
          ...metadata,
          onboarding_completed: true,
          language_level: languageLevel,
          daily_word_goal: dailyGoal,
        },
      })

      toast.success('Profiliniz hazır! 🎉')
      router.push('/')
      router.refresh()
    } catch (err) {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (step < 3) setStep((s) => s + 1)
    if (step === 3) handleComplete()
  }

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  if (authLoading || !user || user.user_metadata?.onboarding_completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-blue px-4">
        <div className="flex items-center gap-2 text-accent-blue">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Yükleniyor...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-deep-blue px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s.id <= step ? 'bg-accent-blue' : 'bg-text-gray/30'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <h1 className="text-2xl font-bold text-white mb-2">
                Hoş geldiniz!
              </h1>
              <p className="text-text-gray mb-8">
                Hadi başlayalım. Birkaç basit soruyla profilinizi oluşturacağız.
              </p>
            </motion.div>
          )}

          {/* Step 1: Language Level */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold text-white mb-2">
                İngilizce seviyeniz nedir?
              </h2>
              <p className="text-text-gray text-sm mb-6">
                Size uygun içerikler sunacağız
              </p>
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGE_LEVELS.map((level) => (
                  <Button
                    key={level}
                    variant={languageLevel === level ? 'default' : 'outline'}
                    className={
                      languageLevel === level
                        ? 'bg-accent-blue text-deep-blue hover:bg-accent-blue/90'
                        : 'border-text-gray/50 text-text-gray hover:border-accent-blue hover:text-accent-blue'
                    }
                    onClick={() => setLanguageLevel(level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Daily Goal */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold text-white mb-2">
                Günlük kelime hedefiniz?
              </h2>
              <p className="text-text-gray text-sm mb-6">
                Öğrenmek istediğiniz günlük kelime sayısı
              </p>
              <div className="grid grid-cols-2 gap-3">
                {DAILY_GOALS.map((goal) => (
                  <Button
                    key={goal}
                    variant={dailyGoal === goal ? 'default' : 'outline'}
                    className={
                      dailyGoal === goal
                        ? 'bg-accent-blue text-deep-blue hover:bg-accent-blue/90 py-6'
                        : 'border-text-gray/50 text-text-gray hover:border-accent-blue hover:text-accent-blue py-6'
                    }
                    onClick={() => setDailyGoal(goal)}
                  >
                    {goal} kelime/gün
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Completion */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <h2 className="text-xl font-bold text-white mb-2">
                Hazırsınız!
              </h2>
              <p className="text-text-gray mb-6">
                Seviye: {languageLevel} · Hedef: {dailyGoal} kelime/gün
              </p>
              <p className="text-accent-blue text-sm">
                Dashboard&apos;a giderek hemen başlayabilirsiniz.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-10">
          {step > 0 && (
            <Button
              variant="outline"
              className="border-text-gray/50 text-text-gray hover:border-accent-blue hover:text-accent-blue flex-1"
              onClick={handlePrev}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 bg-accent-blue text-deep-blue hover:bg-accent-blue/90"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : step === 3 ? (
              'Başla'
            ) : (
              <>
                İleri
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
