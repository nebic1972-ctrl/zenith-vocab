'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, User, UserPlus, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      // Tam sayfa yenilemesi ile yönlendir (Cache temizlenir)
      setTimeout(() => {
        window.location.href = '/library';
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Başlık */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">NeuroRead</h1>
          <p className="text-zinc-400">Yeni hesap oluşturun</p>
        </div>

        {/* Form Kartı */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="animate-spin text-green-500" size={32} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Kayıt Başarılı!</h2>
              <p className="text-zinc-400">Giriş yapılıyor...</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              {/* Error Toast */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Full Name Input */}
              <div className="space-y-2">
                <label className="text-sm text-zinc-400 font-medium">Ad Soyad</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Adınız Soyadınız"
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm text-zinc-400 font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm text-zinc-400 font-medium">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    suppressHydrationWarning
                  />
                </div>
                <p className="text-xs text-zinc-500">En az 6 karakter olmalı</p>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                suppressHydrationWarning
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Kayıt yapılıyor...
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    Kayıt Ol
                  </>
                )}
              </button>
            </form>
          )}

          {!success && (
            <>
              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-zinc-700" />
                <span className="text-zinc-500 text-sm">veya</span>
                <div className="flex-1 h-px bg-zinc-700" />
              </div>

              {/* Login Link */}
              <p className="text-center text-zinc-400">
                Zaten hesabınız var mı?{' '}
                <Link href="/login" className="text-green-500 hover:text-green-400 font-medium transition-colors">
                  Giriş Yap
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
