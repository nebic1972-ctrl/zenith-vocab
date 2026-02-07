import { Suspense } from 'react'
import RegisterForm from '@/components/auth/RegisterForm'

export const metadata = {
  title: 'Sign Up - Zenith Vocab',
  description: 'Create your account'
}

function RegisterContent() {
  return <RegisterForm />
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Get Started
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create your account to start learning
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          }
        >
          <RegisterContent />
        </Suspense>
      </div>
    </div>
  )
}
