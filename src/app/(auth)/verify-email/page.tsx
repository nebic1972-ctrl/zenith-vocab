import { Suspense } from 'react'
import VerifyEmailContent from '@/components/auth/VerifyEmailContent'

export const metadata = {
  title: 'Verify Email - Zenith Vocab',
  description: 'Verify your email address'
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                E-posta Doğrulanıyor
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                E-posta adresiniz doğrulanırken lütfen bekleyin...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
