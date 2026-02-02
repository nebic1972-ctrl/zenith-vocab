"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Trophy, Clock, BookOpen, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultModalProps {
  isOpen: boolean;
  finalWpm: number;
  durationSeconds: number;
  wordsRead: number;
  onSave: (comprehensionScore: number) => Promise<void>;
  onCancel?: () => void;
  onClose: () => void;
}

export default function ResultModal({
  isOpen,
  finalWpm,
  durationSeconds,
  wordsRead,
  onSave,
  onCancel,
  onClose,
}: ResultModalProps) {
  const [comprehensionScore, setComprehensionScore] = useState(75); // Default to 75%
  const [isSaving, setIsSaving] = useState(false);
  const [speedWarning, setSpeedWarning] = useState<string | null>(null);

  // CRITICAL: Sanity checks for unrealistic speeds
  const clampedWpm = finalWpm > 5000 ? 5000 : finalWpm;
  const hasSpeedWarning = finalWpm > 5000;
  const isTooShort = durationSeconds < 5;

  // Format duration as mm:ss
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate efficiency score using clamped WPM
  const efficiencyScore = Math.round((clampedWpm * comprehensionScore) / 100);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // CRITICAL: Await the save operation completely before closing
      await onSave(comprehensionScore);
      // Only close if save succeeds
      onClose();
    } catch (error) {
      console.error('🔴 [RESULT-MODAL] Failed to save session:', error);
      // Don't close on error - let user retry or cancel
      // The error is already logged, user can see it in console or we could show a toast
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Oturum Özeti
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Big Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <p className="text-xs text-zinc-500 mb-1">Final Hız</p>
              <p className="text-2xl font-bold text-white">{clampedWpm}</p>
              <p className="text-xs text-zinc-500 mt-1">WPM</p>
              {hasSpeedWarning && (
                <p className="text-xs text-amber-400 mt-1 font-semibold">
                  ⚠️ Hız sınırını aştınız! Skor 5000'e sabitlendi.
                </p>
              )}
            </div>

            <div className="text-center p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex justify-center mb-2">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              <p className="text-xs text-zinc-500 mb-1">Toplam Süre</p>
              <p className="text-2xl font-bold text-white">{formatDuration(durationSeconds)}</p>
              <p className="text-xs text-zinc-500 mt-1">dakika</p>
            </div>

            <div className="text-center p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex justify-center mb-2">
                <BookOpen className="h-6 w-6 text-amber-400" />
              </div>
              <p className="text-xs text-zinc-500 mb-1">Okunan Kelime</p>
              <p className="text-2xl font-bold text-white">{wordsRead.toLocaleString()}</p>
              <p className="text-xs text-zinc-500 mt-1">kelime</p>
            </div>
          </div>

          {/* Comprehension Slider */}
          <div className="space-y-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-300">
                Anlama Oranı
              </label>
              <span className="text-lg font-bold text-purple-400">
                {comprehensionScore}%
              </span>
            </div>
            <Slider
              value={[comprehensionScore]}
              onValueChange={(value) => setComprehensionScore(value[0])}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-zinc-500">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Efficiency Score */}
          <div className="text-center p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <p className="text-sm font-semibold text-zinc-300">Verimlilik Skoru</p>
            </div>
            <p className="text-3xl font-bold text-white">
              {efficiencyScore}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              (WPM × Anlama) / 100
            </p>
          </div>

          {/* Warning Messages */}
          {isTooShort && (
            <div className="p-3 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 text-sm text-center">
              ⚠️ Oturum çok kısa (5 saniyeden az). Bu oturum kaydedilmeyecek.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {onCancel && (
              <Button
                onClick={onCancel}
                disabled={isSaving}
                variant="outline"
                className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                İptal
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving || isTooShort}
              className={cn(
                "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-6 text-lg",
                onCancel ? "flex-1" : "w-full",
                isTooShort && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSaving ? "Kaydediliyor..." : isTooShort ? "Çok Kısa (Kaydedilemez)" : "Kaydet ve Çık"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
