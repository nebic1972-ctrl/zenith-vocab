'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

/**
 * Eski /share/[token] yolu - /shared/[token]'a yönlendirir
 */
export default function ShareRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  useEffect(() => {
    if (token) {
      router.replace(`/shared/${token}`)
    }
  }, [token, router])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Yönlendiriliyor...</p>
      </div>
    </div>
  )
}
