"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Brain, Trophy } from "lucide-react";

interface QuizModalProps {
  bookTitle: string;
  onClose: () => void;
}

export function QuizModal({ bookTitle, onClose }: QuizModalProps) {
  const [step, setStep] = useState<"QUESTION" | "RESULT">("QUESTION");
  const [score, setScore] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);

  // DEMO İÇERİKLER İÇİN SORULAR (Basit mantık)
  const getQuestions = () => {
    if (bookTitle.includes("Yapay Zeka")) {
      return [
        { q: "Metne göre yapay zeka etiği ne tür bir problemdir?", options: ["Sadece teknik", "Felsefi bir çıkmaz", "Hukuki bir sorun"], correct: 1 },
        { q: "Hangi ikilem örnek verilmiştir?", options: ["Trolley (Vagon) İkilemi", "Mahkum İkilemi", "Asansör İkilemi"], correct: 0 }
      ];
    } else if (bookTitle.includes("James Webb")) {
      return [
        { q: "James Webb hangisinin halefi olarak görülür?", options: ["Kepler", "Hubble", "Voyager"], correct: 1 },
        { q: "Teleskop hangi ışığı gözlemleyebilir?", options: ["Morötesi", "Röntgen", "Kızılötesi"], correct: 2 }
      ];
    } else {
      // GENEL SORULAR (Kendi eklediğin metinler için)
      return [
        { q: "Okuduğunuz metnin ana fikri sizce anlaşıldı mı?", options: ["Kısmen", "Evet, Tamamen", "Hayır"], correct: 1 },
        { q: "Okuma hızınız metni takip etmenize engel oldu mu?", options: ["Evet, çok hızlıydı", "Hayır, tam kıvamındaydı", "Biraz"], correct: 1 }
      ];
    }
  };

  const questions = getQuestions();

  const handleAnswer = (index: number) => {
    if (index === questions[currentQ].correct) setScore(score + 1);
    
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setStep("RESULT");
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[500px] [&>button]:hidden">
        
        {step === "QUESTION" && (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Brain className="w-6 h-6 text-purple-500" /> Anlama Kontrolü
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Okuduğunuz metni ne kadar anladığınızı kontrol edin.
              </DialogDescription>
              <p className="text-zinc-500 text-sm">Soru {currentQ + 1} / {questions.length}</p>
            </DialogHeader>

            <div className="py-4">
              <h3 className="text-lg font-medium mb-6">{questions[currentQ].q}</h3>
              <div className="space-y-3">
                {questions[currentQ].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className="w-full text-left p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500 hover:bg-zinc-800 transition"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "RESULT" && (
          <div className="text-center space-y-6 py-4">
             <div className="flex justify-center">
                {score === questions.length ? (
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Trophy className="w-10 h-10 text-green-500" />
                    </div>
                ) : (
                    <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-yellow-500" />
                    </div>
                )}
             </div>
             
             <div>
                <h2 className="text-2xl font-bold mb-2">
                    {score === questions.length ? "Mükemmel!" : "Tamamlandı"}
                </h2>
                <p className="text-zinc-400">
                    {questions.length} sorudan {score} tanesini doğru bildin.
                </p>
             </div>

             <Button onClick={onClose} className="w-full bg-white text-black font-bold h-12">
                Kütüphaneye Dön
             </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
