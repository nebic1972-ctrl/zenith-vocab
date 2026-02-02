"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useNeuroStore } from "@/store/useNeuroStore";
import { createClient } from "@/lib/supabase/client";
import { Home, BookOpen, LogOut, User, Brain, Activity, Bookmark } from "lucide-react";
import { toast } from "sonner";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, xp, level, setUser } = useNeuroStore();

  if (pathname === "/" || pathname.startsWith("/reader") || pathname.startsWith("/auth")) {
    return null;
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    toast.success("Oturum kapatıldı.");
    router.push("/");
  };

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Kütüphane", href: "/library", icon: BookOpen },
    { name: "Kelimelerim", href: "/vocabulary", icon: Bookmark },
    { name: "Neuro Gym", href: "/gym", icon: Activity },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 md:w-64 bg-[#0A0A0A] border-r border-white/5 flex flex-col justify-between z-50 transition-all duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Brain size={18} className="text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight hidden md:block text-white">
          NeuroRead
        </span>
      </div>

      <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                ${isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"}
              `}
            >
              <item.icon size={22} className={isActive ? "animate-pulse" : "group-hover:scale-110 transition-transform"} />
              <span className="hidden md:block font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center border-2 border-black overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-gray-300" />
            )}
          </div>
          <div className="hidden md:block overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user?.name || "Kaptan"}</p>
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
          <LogOut size={18} />
          <span className="hidden md:block">Oturumu Kapat</span>
        </button>
      </div>
    </aside>
  );
}
