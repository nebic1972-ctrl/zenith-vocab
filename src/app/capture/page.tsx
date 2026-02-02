"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MobileCamera = dynamic(
  () => import("@/features/vision/components/MobileCamera"),
  {
    ssr: false,
    loading: () => (
      <div className="p-10 text-center text-slate-500">Kamera açılıyor...</div>
    ),
  }
);

export default function CapturePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace("/login");
      else setUser(user);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Yükleniyor...
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505]">
      <div className="sticky top-0 bg-white dark:bg-[#0a0a0a] shadow-sm z-10 p-4 border-b border-white/10">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Link
            href="/dashboard"
            className="min-h-[44px] min-w-[44px] touch-manipulation p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg inline-flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-semibold">Belge Tara</h1>
        </div>
      </div>

      <MobileCamera userId={user.id} saveAndRedirect />

      <div className="p-4 max-w-md mx-auto">
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">İpuçları</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Sayfayı düz ve iyi ışıklı bir yere koyun</li>
            <li>• Metni çerçeveye sığdırın</li>
            <li>• Gölge düşmesin</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
