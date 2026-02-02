"use client";

import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="p-4 rounded-full bg-gray-800/50 inline-flex">
          <WifiOff className="w-12 h-12 text-gray-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold mb-2">Çevrimdışısınız</h1>
          <p className="text-gray-400 text-sm">
            İnternet bağlantısı yok. Bağlandığınızda sayfayı yenileyin.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => window.location.reload()}
            className="min-h-[44px] touch-manipulation w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Yenile
          </Button>
          <Link href="/dashboard" className="block">
            <Button variant="outline" className="min-h-[44px] touch-manipulation w-full">
              Ana sayfaya dön
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
