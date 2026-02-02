'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { BrainCircuit } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Hata: " + error.message);
      setLoading(false);
    } else {
      toast.success("Giriş başarılı! Yönlendiriliyorsunuz...");
      router.refresh();
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] opacity-20" />
      </div>

      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 relative z-10">
        <div className="flex justify-center mb-8 text-blue-500">
          <BrainCircuit size={48} />
        </div>

        <h2 className="text-2xl text-white font-medium text-center mb-2">
          Tekrar Hoşgeldin Kaptan
        </h2>
        <p className="text-gray-500 text-center text-sm mb-10">
          Bilişsel yolculuğuna kaldığın yerden devam et.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="text" 
            placeholder="E-Posta veya Kullanıcı Adı" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
            suppressHydrationWarning={true}
          />
          <input 
            type="password" 
            placeholder="Parola" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
            suppressHydrationWarning={true}
          />
          
          <button 
            type="submit" 
            disabled={loading} 
            className="block w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-center hover:bg-blue-500 transition-colors mt-6 disabled:opacity-50"
            suppressHydrationWarning={true}
          >
            {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Hesabın yok mu?{' '}
          <Link
            href="/auth/register"
            className="text-blue-500 hover:underline"
          >
            Kayıt Ol
          </Link>
        </div>
      </div>
    </div>
  );
}
