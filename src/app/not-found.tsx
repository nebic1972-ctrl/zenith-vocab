import Link from "next/link";
import { Brain, Home, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1E1E2E] text-[#E0E0E0] p-4">
      <div className="bg-[#252538] p-8 rounded-2xl shadow-2xl border border-white/5 text-center max-w-md w-full">
        <Brain className="w-20 h-20 text-indigo-400 mx-auto mb-6 animate-pulse" />
        <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Bağlantı Koptu
        </h2>
        <p className="text-gray-400 mb-8">
          Aradığınız sinaptik veriye ulaşılamadı (404).
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all hover:scale-105 min-h-[44px] touch-manipulation"
          >
            <Home size={20} />
            Merkeze Dön
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-3 border border-white/20 text-gray-300 hover:bg-white/10 rounded-xl font-medium transition-all min-h-[44px] touch-manipulation"
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
