'use client';

import { useState, useEffect } from 'react';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { useNeuroStore } from '@/store/useNeuroStore';
import { generateQuiz, type QuizItem } from '@/lib/aiProvider';

export default function AIQuizModal({
  content,
  isOpen,
  onClose,
}: {
  content: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizItem[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const gainXp = useNeuroStore((s) => s.gainXp);

  useEffect(() => {
    if (!isOpen) return;
    setQuestions([]);
    setCurrentStep(0);
    setLoading(false);
  }, [isOpen]);

  const startAnalysis = async () => {
    setLoading(true);
    try {
      const result = await generateQuiz(content);
      if (result && result.length > 0) setQuestions(result);
    } catch (e) {
      console.error('AI Quiz error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="bg-[#111] border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8">
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-400">
                {loading ? (
                  <Loader2 className="animate-spin" size={40} />
                ) : (
                  <BrainCircuit size={40} />
                )}
              </div>
              <h2 className="text-2xl font-medium text-white mb-2">Anlama Analizi</h2>
              <p className="text-gray-500 mb-8 text-sm">
                Yapay zeka metni analiz edip size özel bir test hazırlayacak.
              </p>
              <button
                onClick={startAnalysis}
                disabled={loading}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold transition hover:bg-gray-200 disabled:opacity-50"
              >
                {loading ? 'Analiz Ediliyor...' : 'AI Analizini Başlat'}
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 block">
                Soru {currentStep + 1} / {questions.length}
              </span>
              <h3 className="text-xl text-white mb-8 leading-tight">
                {questions[currentStep].q}
              </h3>
              <div className="space-y-3">
                {questions[currentStep].a.map((opt: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (currentStep < questions.length - 1) {
                        setCurrentStep((s) => s + 1);
                      } else {
                        gainXp(150);
                        onClose();
                        alert('Tebrikler! Anlama puanınız işlendi.');
                      }
                    }}
                    className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl text-left text-sm hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
