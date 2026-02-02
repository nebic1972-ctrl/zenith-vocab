"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNeuroStore } from "@/store/useNeuroStore";
import { BrainCircuit, Key, ExternalLink, CheckCircle2, Accessibility, Sparkles, Globe, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AISettings() {
  const geminiApiKey = useNeuroStore((s) => s.geminiApiKey);
  const setApiKey = useNeuroStore((s) => s.setApiKey);
  const accessibilityMode = useNeuroStore((s) => s.accessibilityMode);
  const setAccessibilityMode = useNeuroStore((s) => s.setAccessibilityMode);
  const userSettings = useNeuroStore((s) => s.userSettings);
  const setLocale = useNeuroStore((s) => s.setLocale);
  const setTimeFormat = useNeuroStore((s) => s.setTimeFormat);
  
  const [inputKey, setInputKey] = useState(geminiApiKey || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentLocale = userSettings?.locale || 'auto';
  const currentTimeFormat = userSettings?.time_format || '24h';

  const handleSave = () => {
    setIsSaving(true);
    setApiKey(inputKey);
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleClear = () => {
    setInputKey('');
    setApiKey('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-purple-400" />
          Yapay Zeka Ayarları
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key" className="text-sm font-medium text-zinc-300">
            Google Gemini API Key
          </Label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                id="api-key"
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className={cn(
                  "pl-10 bg-zinc-800 border-zinc-700 text-white",
                  "focus:border-purple-500 focus:ring-purple-500"
                )}
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
            >
              {showSuccess ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                'Kaydet'
              )}
            </Button>
            {inputKey && (
              <Button
                onClick={handleClear}
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Temizle
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ExternalLink className="w-3 h-3" />
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 underline"
            >
              Anahtar al: https://aistudio.google.com/app/apikey
            </a>
          </div>
        </div>

        {geminiApiKey && (
          <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">
              API anahtarı kaydedildi
            </span>
          </div>
        )}

        {!geminiApiKey && (
          <div className="p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
            <p className="text-xs text-amber-400">
              ⚠️ API anahtarı olmadan AI soru üretimi çalışmayacaktır.
            </p>
          </div>
        )}

        {/* Neuro-Diversity Modes Section */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <div className="flex items-center gap-2">
            <Accessibility className="w-5 h-5 text-purple-400" />
            <Label className="text-sm font-medium text-zinc-300">
              Erişilebilirlik ve Odak Modları
            </Label>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {([
              { mode: 'default' as const, label: 'Varsayılan', icon: '⚙️' },
              { mode: 'adhd_focus' as const, label: 'ADHD Odak', icon: '🎯' },
              { mode: 'dyslexia' as const, label: 'Disleksi', icon: '📖' },
              { mode: 'calm' as const, label: 'Sakin', icon: '🌿' },
            ]).map(({ mode, label, icon }) => (
              <Button
                key={mode}
                onClick={() => setAccessibilityMode(mode)}
                variant={accessibilityMode === mode ? "default" : "outline"}
                className={cn(
                  "h-auto py-3 flex flex-col items-center gap-1",
                  accessibilityMode === mode
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0"
                    : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                )}
              >
                <span className="text-lg">{icon}</span>
                <span className="text-xs font-medium">{label}</span>
              </Button>
            ))}
          </div>
          
          <p className="text-xs text-zinc-400 leading-relaxed pt-2">
            Bu modlar, öğrenme farklılıklarına destek olmak için tasarlanmıştır. Tıbbi tedavi yerine geçmez.
          </p>
        </div>

        {/* Localization Section */}
        <div className="pt-4 border-t border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-400" />
            <Label className="text-sm font-medium text-zinc-300">
              Dil ve Bölge
            </Label>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {([
              { locale: 'auto' as const, label: 'Otomatik' },
              { locale: 'tr-TR' as const, label: 'Türkçe' },
              { locale: 'en-US' as const, label: 'English' },
            ]).map(({ locale, label }) => (
              <Button
                key={locale}
                onClick={() => setLocale(locale)}
                variant={currentLocale === locale ? "default" : "outline"}
                className={cn(
                  "h-auto py-2.5",
                  currentLocale === locale
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0"
                    : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                )}
              >
                <span className="text-xs font-medium">{label}</span>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <Label className="text-sm font-medium text-zinc-300">
              Saat Formatı
            </Label>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {([
              { format: '24h' as const, label: '24 Saat (14:30)' },
              { format: '12h' as const, label: '12 Saat (2:30 PM)' },
            ]).map(({ format, label }) => (
              <Button
                key={format}
                onClick={() => setTimeFormat(format)}
                variant={currentTimeFormat === format ? "default" : "outline"}
                className={cn(
                  "h-auto py-2.5",
                  currentTimeFormat === format
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0"
                    : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                )}
              >
                <span className="text-xs font-medium">{label}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
