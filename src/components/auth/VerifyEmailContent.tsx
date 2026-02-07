'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      const type = searchParams.get('type')

      if (!token || type !== 'email') {
        toast.error('Geçersiz doğrulama linki')
        router.push('/login')
        return
      }

      try {
        const supabase = createClient()
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email'
        })

        if (error) throw error

        toast.success('E-posta başarıyla doğrulandı!')
        router.push('/vocabulary')
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'E-posta doğrulanamadı'
        console.error('Verification error:', error)
        toast.error(message)
        router.push('/login')
      } finally {
        setVerifying(false)
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          {verifying ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                E-posta Doğrulanıyor
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                E-posta adresiniz doğrulanırken lütfen bekleyin...
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Doğrulama Tamamlandı
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Uygulamaya yönlendiriliyorsunuz...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
