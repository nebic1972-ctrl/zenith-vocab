"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNeuroStore } from "@/store/useNeuroStore";
import { Menu, Search, Bell, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TopNavProps {
  onMenuClick?: () => void;
  className?: string;
}

export default function TopNav({ onMenuClick, className }: TopNavProps) {
  const router = useRouter();
  const { user } = useNeuroStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/vocabulary?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 md:h-16 items-center gap-4 border-b border-white/5 bg-black/80 backdrop-blur-md px-4 md:px-6",
        className
      )}
    >
      {/* Hamburger menü (mobil) */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden shrink-0 text-white hover:bg-white/10"
        onClick={onMenuClick}
        aria-label="Menüyü aç"
      >
        <Menu size={24} />
      </Button>

      {/* Arama kutusu */}
      <form
        onSubmit={handleSearch}
        className="flex-1 max-w-xl mx-auto flex items-center"
      >
        <div
          className={cn(
            "relative w-full flex items-center rounded-lg border transition-colors",
            searchFocused
              ? "border-primary/50 bg-white/5"
              : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
          )}
        >
          <Search
            size={18}
            className="absolute left-3 text-muted-foreground shrink-0"
          />
          <Input
            type="search"
            placeholder="Kelime ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="pl-10 pr-4 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9 md:h-10"
          />
        </div>
      </form>

      {/* Sağ taraf: Bildirimler + Avatar */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 relative"
          aria-label="Bildirimler"
        >
          <Bell size={20} />
          {/* Bildirim badge - isteğe bağlı */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </Button>

        <button
          onClick={() => router.push("/profile")}
          className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Profil"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center border-2 border-white/10 overflow-hidden">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={18} className="text-gray-300" />
            )}
          </div>
        </button>
      </div>
    </header>
  );
}
