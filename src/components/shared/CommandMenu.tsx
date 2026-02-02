'use client';

import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useNeuroStore } from '@/store/useNeuroStore';
import { 
  Calculator, User, CreditCard, Settings, 
  Smile, LayoutDashboard, Book, Dumbbell, 
  Trophy, Search, LogOut, Sun, Moon, Laptop 
} from 'lucide-react';

export default function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { isPremium, activatePremium, resetAllData } = useNeuroStore();

  // Klavye Kısayolu (Ctrl+K veya Cmd+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Yönlendirme Fonksiyonu
  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Command.Dialog 
      open={open} 
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[640px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-[9999] overflow-hidden animate-in fade-in zoom-in duration-200"
    >
      <div className="flex items-center border-b border-zinc-800 px-3 pb-2 mb-2">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-white" />
        <Command.Input 
          placeholder="Ne yapmak istiyorsun? (Örn: Kütüphane, Ayarlar...)"
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 text-white disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      
      <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden px-2">
        <Command.Empty className="py-6 text-center text-sm text-zinc-500">Sonuç bulunamadı.</Command.Empty>

        <Command.Group heading="Navigasyon" className="text-xs font-bold text-zinc-500 mb-2 px-2">
          <Item onSelect={() => runCommand(() => router.push('/'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Ana Sayfa
          </Item>
          <Item onSelect={() => runCommand(() => router.push('/library'))}>
            <Book className="mr-2 h-4 w-4" /> Kütüphane
          </Item>
          <Item onSelect={() => runCommand(() => router.push('/exercises'))}>
            <Dumbbell className="mr-2 h-4 w-4" /> Nöro-Spor Salonu
          </Item>
          <Item onSelect={() => runCommand(() => router.push('/leaderboard'))}>
            <Trophy className="mr-2 h-4 w-4" /> Sıralama & Ligler
          </Item>
          <Item onSelect={() => runCommand(() => router.push('/profile'))}>
            <User className="mr-2 h-4 w-4" /> Profil
          </Item>
        </Command.Group>

        <Command.Group heading="Sistem & Ayarlar" className="text-xs font-bold text-zinc-500 mb-2 px-2 mt-4">
          <Item onSelect={() => runCommand(() => router.push('/settings'))}>
            <Settings className="mr-2 h-4 w-4" /> Ayarlar
          </Item>
          {!isPremium && (
            <Item onSelect={() => runCommand(() => { router.push('/library'); alert("Kütüphanedeki Premium bir kitaba tıkla!"); })}>
              <CreditCard className="mr-2 h-4 w-4 text-yellow-500" /> Premium'a Yükselt
            </Item>
          )}
          <Item onSelect={() => runCommand(() => { if(confirm("Verileri silmek istiyor musun?")) resetAllData(); })}>
            <LogOut className="mr-2 h-4 w-4 text-red-500" /> Çıkış & Sıfırla
          </Item>
        </Command.Group>

        <Command.Group heading="Tema" className="text-xs font-bold text-zinc-500 mb-2 px-2 mt-4">
           <Item onSelect={() => alert("Karanlık Mod zaten aktif Kaptan! 😎")}>
             <Moon className="mr-2 h-4 w-4" /> Karanlık Mod
           </Item>
           <Item onSelect={() => alert("Gözlerini koruyoruz, Aydınlık Mod kapalı! 🌑")}>
             <Sun className="mr-2 h-4 w-4" /> Aydınlık Mod
           </Item>
        </Command.Group>

        {/* EASTER EGG - GELİŞTİRİCİ */}
        <Command.Group heading="Geliştirici" className="text-xs font-bold text-zinc-500 mb-2 px-2 mt-4">
           <Item onSelect={() => window.open('https://github.com', '_blank')}>
             <Laptop className="mr-2 h-4 w-4" /> Kaynak Kod (Github)
           </Item>
           <Item onSelect={() => alert("🚀 Kaptan Silver, bu geminin efsanevi pilotudur!")}>
             <Smile className="mr-2 h-4 w-4 text-purple-500" /> Kaptan Kim?
           </Item>
        </Command.Group>
      </Command.List>

      <div className="border-t border-zinc-800 pt-2 px-2 flex justify-between items-center text-[10px] text-zinc-500">
         <span>Navigasyon için <strong>↑↓</strong></span>
         <span>Seçmek için <strong>Enter</strong></span>
      </div>
    </Command.Dialog>
  );
}

// Liste Elemanı (Stil tekrarını önlemek için)
function Item({ children, onSelect }: { children: React.ReactNode, onSelect: () => void }) {
  return (
    <Command.Item 
      onSelect={onSelect}
      className="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm text-zinc-300 outline-none data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white transition-colors"
    >
      {children}
    </Command.Item>
  );
}
