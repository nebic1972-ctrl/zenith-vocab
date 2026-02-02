"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNeuroStore, DistractionLevel } from "@/store/useNeuroStore";
import { Brain, Smartphone, Sparkles, AlertTriangle } from "lucide-react";

interface PreFlightCheckProps {
  isOpen: boolean;
  onComplete: () => void;
  onCancel?: () => void;
  /** If true, renders without Dialog wrapper (for custom overlay usage) */
  inline?: boolean;
}

interface DistractionOption {
  level: DistractionLevel;
  emoji: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const DISTRACTION_OPTIONS: DistractionOption[] = [
  {
    level: 'clean',
    emoji: '🧘‍♂️',
    label: 'Temiz',
    description: 'Hiç / Odaklıyım',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 hover:bg-green-500/20',
    borderColor: 'border-green-500/30 hover:border-green-500/50',
  },
  {
    level: 'moderate',
    emoji: '📱',
    label: 'Normal',
    description: 'Biraz baktım',
    icon: <Smartphone className="w-5 h-5" />,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10 hover:bg-yellow-500/20',
    borderColor: 'border-yellow-500/30 hover:border-yellow-500/50',
  },
  {
    level: 'high_dopamine',
    emoji: '🧠🔥',
    label: 'Yoğun',
    description: 'Dopamin Doluyum',
    icon: <Brain className="w-5 h-5" />,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 hover:bg-red-500/20',
    borderColor: 'border-red-500/30 hover:border-red-500/50',
  },
];

export default function PreFlightCheck({ isOpen, onComplete, onCancel, inline = false }: PreFlightCheckProps) {
  const [selectedLevel, setSelectedLevel] = useState<DistractionLevel | null>(null);
  const [showCoachNudge, setShowCoachNudge] = useState(false);
  
  const setDistractionLevel = useNeuroStore((s) => s.setDistractionLevel);
  const setPreFlightDone = useNeuroStore((s) => s.setPreFlightDone);

  const handleSelect = (level: DistractionLevel) => {
    setSelectedLevel(level);
    setDistractionLevel(level);
    
    // Show coach nudge for high_dopamine
    if (level === 'high_dopamine') {
      setShowCoachNudge(true);
      // Auto-dismiss nudge after 3 seconds
      setTimeout(() => {
        setShowCoachNudge(false);
        setPreFlightDone(true);
        onComplete();
      }, 3000);
    } else {
      setPreFlightDone(true);
      onComplete();
    }
  };

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Shared content for both inline and dialog modes
  const content = (
    <div className="space-y-6 py-4">
      {/* Header - only show in inline mode (Dialog has its own header) */}
      {inline && (
        <div className="text-center mb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Zihin Durumu Kontrolü</h2>
          </div>
        </div>
      )}

      {/* Question */}
      <div className="text-center">
        <p className="text-zinc-300 text-lg">
          Son 1 saatte ne kadar sosyal medya kullandın?
        </p>
        <p className="text-zinc-500 text-sm mt-1">
          Bu bilgi, antrenmanını kişiselleştirmemize yardımcı olacak.
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {DISTRACTION_OPTIONS.map((option) => (
          <Button
            key={option.level}
            onClick={() => handleSelect(option.level)}
            variant="outline"
            className={`w-full h-auto py-4 px-4 flex items-center gap-4 transition-all duration-200 ${option.bgColor} ${option.borderColor} ${
              selectedLevel === option.level ? 'ring-2 ring-purple-500' : ''
            }`}
          >
            <span className="text-3xl">{option.emoji}</span>
            <div className="flex-1 text-left">
              <div className={`font-bold ${option.color}`}>
                {option.label}
              </div>
              <div className="text-sm text-zinc-400">
                {option.description}
              </div>
            </div>
            <div className={option.color}>
              {option.icon}
            </div>
          </Button>
        ))}
      </div>

      {/* Coach Nudge Toast */}
      {showCoachNudge && (
        <div className="animate-in slide-in-from-bottom-5 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-orange-300 font-medium text-sm">
                Koç Önerisi
              </p>
              <p className="text-zinc-300 text-sm mt-1">
                Egzersiz hızın otomatik olarak <strong>&apos;Isınma&apos;</strong> modunda başlayacak.
                İlk 15 saniye %20 daha yavaş tempo ile başlayacaksın.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Button - only in inline mode */}
      {inline && onCancel && (
        <div className="pt-2">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="w-full text-zinc-500 hover:text-zinc-300"
          >
            İptal
          </Button>
        </div>
      )}

      {/* Info Footer */}
      <div className="text-center">
        <p className="text-xs text-zinc-500">
          🔬 Bu veri, yapay zeka motorumuzu eğitmek için anonim olarak kullanılacak.
        </p>
      </div>
    </div>
  );

  // Inline mode: render content directly without Dialog
  if (inline) {
    if (!isOpen) return null;
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        {content}
      </div>
    );
  }

  // Dialog mode: wrap in Dialog component
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2 justify-center">
            <Brain className="w-6 h-6 text-purple-400" />
            Zihin Durumu Kontrolü
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
