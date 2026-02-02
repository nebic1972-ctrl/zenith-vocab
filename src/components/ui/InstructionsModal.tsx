"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InstructionItem {
  icon?: React.ReactNode;
  text: string;
}

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  instructions: string[] | InstructionItem[];
}

export default function InstructionsModal({
  isOpen,
  onClose,
  title,
  instructions,
}: InstructionsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-zinc-900 border-zinc-800 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-4 space-y-3">
          {instructions.map((instruction, index) => {
            const isString = typeof instruction === 'string';
            const text = isString ? instruction : instruction.text;
            const icon = isString ? null : instruction.icon;

            return (
              <div
                key={index}
                className="flex items-start gap-3 text-zinc-300"
              >
                <div className="mt-0.5 flex-shrink-0">
                  {icon ? (
                    <div className="text-purple-400">{icon}</div>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                  )}
                </div>
                <p className="text-sm leading-relaxed flex-1">{text}</p>
              </div>
            );
          })}
        </div>

        {/* Incentive Message */}
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30">
          <p className="text-xs text-zinc-300 leading-relaxed flex items-start gap-2">
            <span className="text-lg">💡</span>
            <span>
              <strong className="text-white">İpucu:</strong> Talimatları dikkatli okuyan kullanıcılar, performans hedeflerine %30 daha hızlı ulaşıyor.
            </span>
          </p>
        </div>

        <div className="flex justify-end pt-2 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Tamam
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
