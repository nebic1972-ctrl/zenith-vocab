'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNeuroStore } from '@/store/useNeuroStore';
import CognitiveRadar from '@/components/CognitiveRadar';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Award, BookOpen, BookMarked, FileText } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { xp } = useNeuroStore();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
  }, [user, loading, router]);
  const currentTier = xp >= 10000 ? 'Diamond' : xp >= 5000 ? 'Gold' : xp >= 1000 ? 'Silver' : 'Bronze';
  const league = { currentTier };

  const [readingStats, setReadingStats] = useState<{
    booksWithProgress: number;
    totalWordsReached: number;
    vocabularyCount: number;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const { data: progressRows } = await supabase
          .from('reading_progress')
          .select('current_position')
          .eq('user_id', user.id);
        const booksWithProgress = (progressRows ?? []).filter((r) => (r.current_position ?? 0) > 0).length;
        const totalWordsReached = (progressRows ?? []).reduce((s, r) => s + (r.current_position ?? 0), 0);

        const { count } = await supabase
          .from('vocabulary')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        setReadingStats({
          booksWithProgress,
          totalWordsReached,
          vocabularyCount: count ?? 0,
        });
      } catch {
        setReadingStats({ booksWithProgress: 0, totalWordsReached: 0, vocabularyCount: 0 });
      }
    };
    load();
  }, []);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-[#050505] pl-72 pr-8 py-8 text-white">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-3xl font-bold shadow-2xl">
            NR
          </div>
          <div>
            <h1 className="text-3xl font-medium">Kaptan Pilot</h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
              <Shield size={12} className="text-green-500" /> Premium Üye
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Mevcut Lig
          </div>
          <div className="text-2xl font-bold text-yellow-500 flex items-center justify-end gap-2">
            <Award size={24} /> {league?.currentTier ?? 'Bronze'}
          </div>
        </div>
      </header>

      {readingStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Okumaya başlanan kitap</p>
              <p className="text-2xl font-bold text-white">{readingStats.booksWithProgress}</p>
            </div>
          </div>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Toplam okunan kelime (kitaplar)</p>
              <p className="text-2xl font-bold text-white">{readingStats.totalWordsReached.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <BookMarked className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Kelime kartı</p>
              <p className="text-2xl font-bold text-white">{readingStats.vocabularyCount}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8">
          <h3 className="text-lg font-medium mb-6">Bilişsel Kimlik</h3>
          <CognitiveRadar />
        </div>

        <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
          <h3 className="text-lg font-medium mb-4">Hesap Ayarları</h3>

          <div className="group cursor-pointer">
            <label className="block text-xs text-gray-500 uppercase font-bold mb-2">
              E-Posta
            </label>
            <div className="text-gray-300 border-b border-white/10 pb-2 group-hover:border-blue-500 transition-colors">
              kaptan@neuroread.com
            </div>
          </div>

          <div className="group cursor-pointer">
            <label className="block text-xs text-gray-500 uppercase font-bold mb-2">
              Sınav Hedefi
            </label>
            <div className="text-gray-300 border-b border-white/10 pb-2 group-hover:border-blue-500 transition-colors">
              IELTS Academic (2026)
            </div>
          </div>

          <button
            type="button"
            className="w-full mt-4 py-4 border border-white/10 rounded-xl text-sm font-bold hover:bg-white hover:text-black transition-colors"
          >
            Profili Düzenle
          </button>
        </div>
      </div>
    </div>
  );
}
