'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { BrainCircuit, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Kayıt İsteği (e-posta doğrulama linki /auth/callback'e yönlendirir)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
      },
    });

    if (error) {
      toast.error("Hata: " + error.message);
      setLoading(false);
    } else {
      // 2. KRİTİK HAMLE: Oturumun kurulmasını bekle
      // Hemen yönlendirme! Supabase'in local storage'a yazması için 1 saniye verelim
      // veya oturumun session objesini kontrol edelim.
      
      if (data.session) {
         toast.success("Hesap oluşturuldu! Panele yönlendiriliyorsunuz.");
         router.refresh();
         router.push('/'); 
      } else {
         // Bazen e-posta onayı (Confirm Email) gerekebilir. 
         // Eğer Supabase ayarlarında "Confirm Email" açıksa session null gelir.
         // Bu durumda kullanıcıyı uyar:
         toast.success("Kayıt başarılı! Lütfen e-postanızı onaylayın.");
         setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 relative z-10">
        <div className="flex justify-center mb-8 text-blue-500">
          <BrainCircuit size={48} />
        </div>

        <h2 className="text-2xl text-white font-medium text-center mb-2">
          Aramıza Katıl
        </h2>
        <p className="text-gray-500 text-center text-sm mb-10">
          Bilişsel performansını zirveye taşı.
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Kullanıcı Adı"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            suppressHydrationWarning={true}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <input
            type="email"
            placeholder="E-Posta"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            suppressHydrationWarning={true}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <input
            type="password"
            placeholder="Parola"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            suppressHydrationWarning={true}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />

          <button
            type="submit"
            disabled={loading}
            suppressHydrationWarning={true}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500 transition-colors mt-6 disabled:opacity-50"
          >
            {loading ? (
              'Kaydediliyor...'
            ) : (
              <>
                Hesap Oluştur
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Zaten hesabın var mı?{' '}
          <Link href="/auth/login" className="text-blue-500 hover:underline">
            Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
}
