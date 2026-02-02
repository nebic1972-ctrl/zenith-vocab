"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

const REMINDER_KEY = "neuro-reminder-hour";
const REMINDER_ENABLED_KEY = "neuro-reminder-enabled";
const REMINDER_LAST_KEY = "neuro-reminder-last-shown";

export function ReadingReminderToast() {
  const lastShownRef = useRef<string | null>(null);

  useEffect(() => {
    const check = () => {
      if (typeof window === "undefined") return;
      try {
        const enabled = window.localStorage.getItem(REMINDER_ENABLED_KEY) === "true";
        const hourStr = window.localStorage.getItem(REMINDER_KEY);
        if (!enabled || hourStr == null) return;

        const hour = parseInt(hourStr, 10);
        if (Number.isNaN(hour) || hour < 0 || hour > 23) return;

        const now = new Date();
        if (now.getHours() !== hour) return;

        const today = now.toDateString();
        const last = window.localStorage.getItem(REMINDER_LAST_KEY);
        if (last === today || lastShownRef.current === today) return;

        lastShownRef.current = today;
        window.localStorage.setItem(REMINDER_LAST_KEY, today);
        toast("Okuma zamanı! 📚", {
          description: "Kaldığın yerden devam et.",
          duration: 5000,
        });
      } catch {
        // ignore
      }
    };

    check();
    const interval = setInterval(check, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}

export const REMINDER_STORAGE_KEYS = { REMINDER_KEY, REMINDER_ENABLED_KEY };
