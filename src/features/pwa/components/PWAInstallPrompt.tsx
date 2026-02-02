"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

const PWA_DISMISS_KEY = "neuro-pwa-install-dismissed";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const dismissed = typeof window !== "undefined" && window.localStorage?.getItem(PWA_DISMISS_KEY);
    if (dismissed === "true") return;

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Standalone = zaten PWA olarak açılmış
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as { standalone?: boolean }).standalone === true;
    if (standalone) setIsInstalled(true);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      window.localStorage?.setItem(PWA_DISMISS_KEY, "true");
    } catch {
      // ignore
    }
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-white/10 bg-[#111] p-4 shadow-lg md:left-auto md:right-6">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-white">NeuroRead&apos;i ana ekrana ekle</p>
          <p className="mt-1 text-xs text-gray-400">Daha hızlı erişim, çevrimdışı destek.</p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="min-h-[44px] min-w-[44px] touch-manipulation rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"
          aria-label="Kapat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <Button
        onClick={handleInstall}
        className="mt-3 w-full min-h-[44px] touch-manipulation"
      >
        <Download className="mr-2 h-4 w-4" />
        Yükle
      </Button>
    </div>
  );
}
