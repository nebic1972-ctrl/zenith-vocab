'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Award, ArrowRight, BrainCircuit } from 'lucide-react';
import { generateQuizFromText } from '@/services/ai';
import { useNeuroStore } from '@/store/useNeuroStore';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (score: number) => void;
  bookContent: string;
}

export default function QuizModal({ isOpen, onClose, onFinish, bookContent }: QuizModalProps) {
  const { apiKey } = useNeuroStore();
  
  // STATE
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // Modal açılınca soruları üret
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      generateQuizFromText(bookContent)
        .then((aiQuestions) => {
          setQuestions(aiQuestions);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      // Modal kapanırsa state'i sıfırla
      setShowResult(false);
      setCurrentQIndex(0);
      setScore(0);
    }
  }, [isOpen, bookContent]);

  const currentQuestion = questions[currentQIndex];

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (currentQuestion && index === currentQuestion.correctIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(p => p + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  const finalScore = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative min-h-[400px] flex flex-col"
      >
        {/* KAPAT */}
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white z-10"><X /></button>

        {/* 1. YÜKLENİYOR EKRANI */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="mb-6"
            >
              <BrainCircuit className="text-purple-500" size={64} />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">Yapay Zeka Okuyor...</h3>
            <p className="text-zinc-400">
              {apiKey ? "Gemini metni analiz ediyor ve soruları hazırlıyor." : "API Anahtarı bulunamadı, demo sorular hazırlanıyor."}
            </p>
          </div>
        )}

        {/* 2. SORU EKRANI */}
        {!loading && !showResult && currentQuestion && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                Soru {currentQIndex + 1} / {questions.length}
              </span>
              <BrainCircuit className="text-zinc-700" size={24}/>
            </div>

            <h3 className="text-lg font-bold text-white mb-8 leading-relaxed min-h-[60px]">
              {currentQuestion.text}
            </h3>

            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQuestion.correctIndex;
                
                let btnClass = "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700";
                if (isAnswered) {
                  if (isCorrect) btnClass = "bg-green-500/20 border-green-500 text-green-400";
                  else if (isSelected) btnClass = "bg-red-500/20 border-red-500 text-red-400";
                  else btnClass = "bg-zinc-800 border-zinc-700 text-zinc-500 opacity-50";
                } else if (isSelected) {
                  btnClass = "bg-purple-600 text-white border-purple-500";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={isAnswered}
                    className={`w-full text-left p-4 rounded-xl border transition-all font-medium flex justify-between items-center text-sm ${btnClass}`}
                  >
                    <span>{option}</span>
                    {isAnswered && isCorrect && <Check size={18} />}
                    {isAnswered && isSelected && !isCorrect && <X size={18} />}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleNext}
                disabled={!isAnswered}
                className="px-6 py-3 bg-white text-black rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {currentQIndex === questions.length - 1 ? 'Sonucu Gör' : 'Sonraki'} <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* 3. SONUÇ EKRANI */}
        {!loading && showResult && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in">
            <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 text-yellow-500">
              <Award size={48} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Sınav Bitti</h2>
            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-6">
              %{finalScore}
            </div>
            
            <p className="text-zinc-400 mb-8 max-w-xs">
              {finalScore >= 80 ? "Mükemmel! Yapay zeka senin anladığını onayladı." : 
               finalScore >= 50 ? "İyi iş, ama detayları kaçırıyorsun." : 
               "Dikkat! Sadece gözlerinle değil beyninle de okumalısın."}
            </p>

            <button 
              onClick={() => onFinish(finalScore)}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all"
            >
              Tamamla ve Kütüphaneye Dön
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
