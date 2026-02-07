'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Mail, Lock, User, Loader2, Chrome } from 'lucide-react'
import Link from 'next/link'

export default function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { signUp, signInWithGoogle, user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (authLoading || !user) return
    const completed = Boolean(user.user_metadata?.onboarding_completed)
    router.replace(completed ? '/' : '/onboarding')
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signUp(email, password, fullName)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google ile kayıt başarısız')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Kayıt Başarılı!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          E-posta adresinize doğrulama linki gönderdik. Lütfen e-postanızı kontrol edin.
        </p>
        <Link
          href="/login"
          className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
        >
          Giriş Sayfasına Dön
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Kayıt Ol</h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ad Soyad</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500"
              placeholder="Adınız Soyadınız"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">E-posta</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500"
              placeholder="ornek@email.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Şifre</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">En az 6 karakter olmalı</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Kayıt Ol'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">veya</span>
        </div>
      </div>

      <button
        onClick={handleGoogleSignUp}
        disabled={loading}
        type="button"
        className="w-full flex items-center justify-center gap-3 border-2 border-gray-300 dark:border-gray-600 py-3 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Chrome className="w-5 h-5" />
        Google ile Kayıt Ol
      </button>

      <p className="text-center text-gray-600 dark:text-gray-400 mt-6 text-sm">
        Zaten hesabınız var mı?{' '}
        <Link href="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
          Giriş Yap
        </Link>
      </p>
    </div>
  )
}
