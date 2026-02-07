"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNeuroStore } from "@/store/useNeuroStore";
import { createClient } from "@/lib/supabase/client";
import {
  Home,
  BookOpen,
  BookMarked,
  Layers,
  Zap,
  FolderOpen,
  Compass,
  BarChart3,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { toast } from "sonner";

const menuItems = [
  { name: "Ana Sayfa", href: "/dashboard", icon: Home },
  { name: "Metinlerim", href: "/texts", icon: BookOpen },
  { name: "Sözlüğüm", href: "/vocabulary", icon: BookMarked },
  { name: "Flashcards", href: "/flashcards", icon: Layers },
  { name: "Akıllı Çalışma", href: "/study", icon: Zap, emoji: "🧠" },
  { name: "Koleksiyonlar", href: "/collections", icon: FolderOpen },
  { name: "Keşfet", href: "/explore", icon: Compass, emoji: "🌍", badge: "Yeni" },
  { name: "İstatistikler", href: "/statistics", icon: BarChart3, emoji: "📊" },
  { name: "Ayarlar", href: "/settings", icon: Settings, emoji: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { user, xp, level } = useNeuroStore();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Oturum kapatıldı.");
    } catch {
      toast.error("Çıkış yapılamadı.");
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 md:w-64 bg-[#0A0A0A] border-r border-white/5 flex flex-col justify-between z-40 transition-all duration-300 hidden md:flex">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
          <BookMarked size={18} className="text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight hidden md:block text-white truncate">
          Zenith Vocab
        </span>
      </div>

      {/* Navigasyon menüsü */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }
              `}
            >
              {'emoji' in item && item.emoji ? (
                <span className="text-xl shrink-0">{item.emoji}</span>
              ) : (
                <item.icon
                  size={22}
                  className={
                    isActive
                      ? "animate-pulse shrink-0"
                      : "group-hover:scale-110 transition-transform shrink-0"
                  }
                />
              )}
              <span className="hidden md:block font-medium truncate flex-1">
                {item.name}
              </span>
              {'badge' in item && item.badge && (
                <span className="hidden md:inline-flex px-2 py-0.5 text-[10px] font-bold bg-blue-500/30 text-blue-300 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Kullanıcı profili ve çıkış */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center border-2 border-black overflow-hidden shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={20} className="text-gray-300" />
            )}
          </div>
          <div className="hidden md:block overflow-hidden min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {user?.name || "Kullanıcı"}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="text-yellow-500 font-bold">Lvl {level}</span>
              <span className="w-1 h-1 bg-gray-600 rounded-full" />
              <span>{Math.floor(xp)} XP</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          suppressHydrationWarning
          className="w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut size={18} className="shrink-0" />
          <span className="hidden md:block">Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}
