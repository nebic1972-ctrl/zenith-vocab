"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { REMINDER_STORAGE_KEYS } from "./ReadingReminderToast";

const { REMINDER_KEY, REMINDER_ENABLED_KEY } = REMINDER_STORAGE_KEYS;

export function ReadingReminderCard() {
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(20);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setEnabled(window.localStorage.getItem(REMINDER_ENABLED_KEY) === "true");
      const h = window.localStorage.getItem(REMINDER_KEY);
      if (h != null) setHour(parseInt(h, 10) || 20);
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  const handleEnable = async () => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      toast.error("Bu tarayıcı bildirimleri desteklemiyor.");
      return;
    }
    const permission = await window.Notification.requestPermission();
    if (permission === "granted") {
      window.localStorage.setItem(REMINDER_ENABLED_KEY, "true");
      window.localStorage.setItem(REMINDER_KEY, String(hour));
      setEnabled(true);
      toast.success("Okuma hatırlatması açıldı.", {
        description: `Her gün ${hour}:00'da hatırlatılacaksın.`,
      });
    } else {
      toast.info("Bildirim izni verilmedi. Hatırlatma sadece uygulama açıkken çalışır.");
      window.localStorage.setItem(REMINDER_ENABLED_KEY, "true");
      window.localStorage.setItem(REMINDER_KEY, String(hour));
      setEnabled(true);
    }
  };

  const handleDisable = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(REMINDER_ENABLED_KEY);
    window.localStorage.removeItem(REMINDER_KEY);
    setEnabled(false);
    toast.success("Okuma hatırlatması kapatıldı.");
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = parseInt(e.target.value, 10);
    setHour(v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(REMINDER_KEY, String(v));
      if (enabled) toast.success(`Hatırlatma saati ${v}:00 olarak ayarlandı.`);
    }
  };

  if (!mounted) return null;

  return (
    <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <Bell className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Okuma hatırlatması</h3>
          <p className="text-sm text-gray-400">Her gün belirlediğin saatte hatırlatıl</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <select
          value={hour}
          onChange={handleHourChange}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Hatırlatma saati"
        >
          {Array.from({ length: 15 }, (_, i) => i + 8).map((h) => (
            <option key={h} value={h}>
              {h}:00
            </option>
          ))}
        </select>
        {enabled ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisable}
            className="border-slate-700 text-slate-300 hover:bg-red-500/10 hover:text-red-400"
          >
            <BellOff size={14} className="mr-1" /> Kapat
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleEnable}
            className="bg-amber-600 hover:bg-amber-500 text-white"
          >
            <Bell size={14} className="mr-1" /> Bildirim izni ver
          </Button>
        )}
      </div>
    </div>
  );
}
