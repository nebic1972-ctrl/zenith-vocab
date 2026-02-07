'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { FcGoogle } from 'react-icons/fc'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { signInWithGoogle } from '@/lib/auth/auth-service'
import { Button } from '@/components/ui/button'

function LoginContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const error = searchParams.get('error')

  useEffect(() => {
    if (error === 'auth_failed') {
      toast.error('Giriş başarısız', {
        description: 'Lütfen tekrar deneyin',
      })
    }
  }, [error])

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Giriş başarısız'
      toast.error('Giriş başarısız', {
        description: message,
        action: {
          label: 'Tekrar Dene',
          onClick: () => handleGoogleLogin(),
        },
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-blue px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center"
      >
        {/* Logo & Brand */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-blue/10 text-accent-blue mb-4 font-bold text-2xl">
            Z
          </div>
          <h1 className="text-[2.5rem] font-bold text-white mb-2">
            ZENITH-Vocab
          </h1>
          <p className="text-text-gray text-lg">
            Bilimsel Kelime Edinim Sistemi
          </p>
        </div>

        {/* Tagline */}
        <p className="text-text-gray/90 text-sm mb-10 max-w-sm mx-auto">
          Bilişsel yükü optimize edin, kelimeleri kalıcı belleğe kaydedin
        </p>

        {/* Google Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            size="lg"
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium py-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Nöronlar bağlanıyor...
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <FcGoogle className="h-6 w-6" />
                Google ile Giriş Yap
              </span>
            )}
          </Button>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-12 space-y-3 text-text-gray text-sm"
        >
          <p className="flex items-center justify-center gap-2">
            <span>🧠</span> Nöro-bilim destekli öğrenme
          </p>
          <p className="flex items-center justify-center gap-2">
            <span>📊</span> İlerleme takibi
          </p>
          <p className="flex items-center justify-center gap-2">
            <span>🎯</span> Kişiselleştirilmiş pratik
          </p>
        </motion.div>

        {/* Register link */}
        <p className="mt-8 text-text-gray text-sm">
          Hesabınız yok mu? Google ile giriş yaparak otomatik hesap oluşturulur.
        </p>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-deep-blue px-4">
          <div className="flex items-center gap-2 text-accent-blue">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Yükleniyor...</span>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
