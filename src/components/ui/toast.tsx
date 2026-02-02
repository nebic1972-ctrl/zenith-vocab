"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-[10000] animate-in slide-in-from-top-5">
      <div className="bg-zinc-900 border border-green-500/30 rounded-lg shadow-2xl p-4 flex items-center gap-3 min-w-[300px] max-w-md">
        <div className="flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        </div>
        <p className="text-sm text-white flex-1">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
