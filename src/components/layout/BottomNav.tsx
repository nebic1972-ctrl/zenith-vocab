'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Library, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Ana Sayfa', href: '/', icon: Home },
  { label: 'Kütüphane', href: '/library', icon: Library },
  { label: 'Sıralama', href: '/leaderboard', icon: Trophy },
  { label: 'Profil', href: '/profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on reader page
  if (pathname === '/reader') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 safe-area-bottom lg:hidden">
      <div className="max-w-md mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all",
                  isActive 
                    ? "text-purple-400 bg-purple-500/10" 
                    : "text-zinc-500 hover:text-white hover:bg-zinc-800/50"
                )}
              >
                <item.icon size={22} className={cn(isActive && "fill-purple-400/20")} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
