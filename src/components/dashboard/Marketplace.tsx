"use client";

import { useState } from "react";
import { useNeuroStore } from "@/store/useNeuroStore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShoppingBag, Check, Lock, Sparkles } from "lucide-react";
import { levelFromXP } from "@/store/useNeuroStore";

export type ThemeId = 'matrix' | 'paper' | 'cyberpunk';

export interface ThemeItem {
  id: ThemeId;
  name: string;
  description: string;
  requiredLevel: number;
  bgColor: string;
  textColor: string;
  preview: string;
}

const THEMES: ThemeItem[] = [
  {
    id: 'matrix',
    name: 'Matrix Modu',
    description: 'Yeşil metin, siyah arka plan - Matrix tarzı',
    requiredLevel: 5, // Level 5 required
    bgColor: '#000000',
    textColor: '#00ff00',
    preview: '🟢',
  },
  {
    id: 'paper',
    name: 'Kağıt Modu',
    description: 'Sepia arka plan, koyu metin - Kağıt görünümü',
    requiredLevel: 10, // Level 10 required
    bgColor: '#f4ecd8',
    textColor: '#3d2817',
    preview: '📄',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon renkler, futuristik görünüm',
    requiredLevel: 20, // Level 20 required
    bgColor: '#0a0a0a',
    textColor: '#ff00ff',
    preview: '🌃',
  },
];

export default function Marketplace() {
  // 1. EXTRACT EVERYTHING FROM STORE AT THE TOP LEVEL (Safe pattern)
  const { profile, isLoading, unlockTheme, setTheme } = useNeuroStore((state) => ({
    profile: state.profile,
    isLoading: state.isLoading,
    unlockTheme: state.unlockTheme,
    setTheme: state.setTheme,
  }));

  // 2. DERIVE VARIABLES SAFELY (Default values prevent crashes)
  // Use profile as 'user' equivalent (store uses 'profile', not 'user')
  const user = profile; // Alias for clarity
  const activeTheme = user?.selected_theme || 'default';
  const unlockedThemes = (user?.unlocked_themes as ThemeId[]) || ['default'];
  const userLevel = user?.current_level || 1;
  const userId = user?.id;

  // 3. DEBUG LOG (Optional, helps verification)
  // console.log('Market State:', { userId, activeTheme, unlockedThemes });

  const [isUnlocking, setIsUnlocking] = useState<string | null>(null);
  const [isSetting, setIsSetting] = useState<string | null>(null);

  const xp = user?.xp_points ?? 0;
  const level = userLevel;
  const selectedTheme = user?.selected_theme as ThemeId | null;

  const handleUnlock = async (theme: ThemeItem) => {
    if (!userId) return;
    
    // Check if already unlocked
    if (unlockedThemes.includes(theme.id)) {
      return;
    }
    
    // Check if user has required level
    if (level < theme.requiredLevel) {
      alert(`Bu temayı açmak için Seviye ${theme.requiredLevel} gerekiyor. Şu an Seviye ${level}.'desin.`);
      return;
    }

    // Optimistic UI: Show loading state immediately
    setIsUnlocking(theme.id);
    
    try {
      // Unlock theme via store (handles DB update)
      await unlockTheme(theme.id);
      
      // Auto-select when unlocked
      await setTheme(theme.id);
      
      // Reset loading state
      setIsUnlocking(null);
    } catch (error) {
      console.error('Exception during unlock:', error);
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
      setIsUnlocking(null);
    }
  };

  const handleSelect = async (themeId: ThemeId | 'default') => {
    if (!userId) return;
    
    // If selecting a marketplace theme, check if unlocked
    if (themeId !== 'default' && !unlockedThemes.includes(themeId)) {
      return;
    }

    // Optimistic UI: Show loading state immediately
    setIsSetting(themeId === 'default' ? 'default' : themeId);
    
    try {
      // Update store (which persists to database)
      await setTheme(themeId === 'default' ? null : themeId);
      
      // Reset loading state
      setIsSetting(null);
    } catch (error) {
      console.error('Exception during select:', error);
      setIsSetting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
          <p className="text-sm text-zinc-500">Market yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-white bg-clip-text text-transparent">
          Market
        </h2>
        <p className="text-zinc-500 text-sm mt-1">
          XP kazanarak temaları aç ve okuyucunu özelleştir.
        </p>
      </div>

      {/* User Stats */}
      <Card className={cn("overflow-hidden border-white/10 bg-zinc-900/80")}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 mb-1">Mevcut Seviye</p>
              <p className="text-2xl font-bold text-white">Seviye {level}</p>
            </div>
            <div className="p-3 rounded-full bg-amber-500/20">
              <Sparkles className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Default Theme (Always Available) */}
        <Card
          className={cn(
            "overflow-hidden border transition-all",
            (selectedTheme === null || selectedTheme === 'default')
              ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20"
              : "border-white/10 bg-zinc-900/80 hover:border-zinc-700"
          )}
        >
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">⚫</div>
              {(selectedTheme === null || selectedTheme === 'default') && (
                <span className="text-xs px-2 py-1 rounded bg-purple-500/30 text-purple-300 border border-purple-500/50">
                  Seçili
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-white">Varsayılan</h3>
            <p className="text-sm text-zinc-400 mt-1">Koyu tema (Ücretsiz)</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview */}
            <div
              className="h-20 rounded-lg border-2 flex items-center justify-center transition-all bg-black"
              style={{
                borderColor: (selectedTheme === null || selectedTheme === 'default') ? '#ffffff' : 'rgba(255,255,255,0.1)',
              }}
            >
              <span className="text-2xl font-bold text-white">Önizleme</span>
            </div>
            <Button
              onClick={() => handleSelect('default')}
              variant={(activeTheme === null || activeTheme === 'default') ? "default" : "outline"}
              className={cn(
                "w-full",
                (selectedTheme === null || selectedTheme === 'default')
                  ? "bg-purple-500 hover:bg-purple-600"
                  : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              )}
            >
              {(activeTheme === null || activeTheme === 'default') ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Seçili
                </>
              ) : (
                "Kullan"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Marketplace Themes */}
        {THEMES.map((theme) => {
          const isUnlocked = unlockedThemes.includes(theme.id);
          const isSelected = selectedTheme === theme.id;
          const isUnlockingThis = isUnlocking === theme.id;
          const isSettingThis = isSetting === theme.id;
          const canUnlock = level >= theme.requiredLevel;

          return (
            <Card
              key={theme.id}
              className={cn(
                "overflow-hidden border transition-all",
                isSelected
                  ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                  : "border-white/10 bg-zinc-900/80 hover:border-zinc-700"
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl">{theme.preview}</div>
                  {isSelected && (
                    <span className="text-xs px-2 py-1 rounded bg-purple-500/30 text-purple-300 border border-purple-500/50">
                      Seçili
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white">{theme.name}</h3>
                <p className="text-sm text-zinc-400 mt-1">{theme.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview */}
                <div
                  className="h-20 rounded-lg border-2 flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: theme.bgColor,
                    color: theme.textColor,
                    borderColor: isSelected ? theme.textColor : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <span className="text-2xl font-bold">Önizleme</span>
                </div>

                {/* Requirements */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Gereken Seviye:</span>
                  <span className={cn(
                    "font-bold",
                    canUnlock ? "text-green-400" : "text-red-400"
                  )}>
                    {theme.requiredLevel}
                  </span>
                </div>

                {/* Actions */}
                {!isUnlocked ? (
                  <Button
                    onClick={() => handleUnlock(theme)}
                    disabled={!canUnlock}
                    className={cn(
                      "w-full",
                      canUnlock
                        ? "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    )}
                  >
                    {canUnlock ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Aç
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Kilitli
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSelect(theme.id)}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "w-full",
                      isSelected
                        ? "bg-purple-500 hover:bg-purple-600"
                        : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    )}
                    disabled={isSettingThis}
                  >
                    {isSettingThis ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Kullanılıyor...
                      </>
                    ) : isSelected ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Aktif
                      </>
                    ) : (
                      "Kullan"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
