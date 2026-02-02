"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, BrainCircuit, Trophy, CheckCircle2, XCircle, AlertCircle, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNeuroStore } from "@/store/useNeuroStore";
import { generateQuizFromText, type QuizQuestion } from "@/services/gemini";
import type { Flashcard } from "@/store/useNeuroStore";

interface AIQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle?: string;
  bookContent?: string;
}

type QuizStatus = 'idle' | 'loading' | 'quiz' | 'result' | 'error';

export default function AIQuizModal({ isOpen, onClose, bookTitle, bookContent }: AIQuizModalProps) {
  const updateXP = useNeuroStore((s) => s.updateXP);
  const geminiApiKey = useNeuroStore((s) => s.geminiApiKey);
  const saveFlashcard = useNeuroStore((s) => s.saveFlashcard);
  const library = useNeuroStore((s) => s.library);
  
  // Get bookId from library if bookTitle matches
  const bookId = bookTitle ? library.find(b => b.title === bookTitle)?.id : undefined;
  
  const [status, setStatus] = useState<QuizStatus>('idle');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [saveToast, setSaveToast] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setScore(0);
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  // Handle start analysis
  const handleStartAnalysis = async () => {
    if (!geminiApiKey || !geminiApiKey.trim()) {
      setStatus('error');
      setErrorMessage('Lütfen Ayarlar\'dan API Anahtarınızı girin.');
      return;
    }

    if (!bookContent || bookContent.trim().length === 0) {
      setStatus('error');
      setErrorMessage('Metin içeriği bulunamadı.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      // Call Gemini API
      const generatedQuestions = await generateQuizFromText(bookContent, geminiApiKey);
      
      if (generatedQuestions.length === 0) {
        throw new Error('Soru üretilemedi. Lütfen tekrar deneyin.');
      }

      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setStatus('quiz');
    } catch (error) {
      console.error('🔴 [AI-QUIZ] Error generating quiz:', error);
      setStatus('error');
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : 'Soru üretilirken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    }
  };

  // Handle answer click
  const handleAnswerClick = (optionIndex: number) => {
    if (isAnswered || !questions[currentQuestionIndex]) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = optionIndex === currentQuestion.answerIndex;
    
    setSelectedAnswer(optionIndex);
    setIsAnswered(true);
    
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    // Move to next question or result after delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setIsAnswered(false);
      } else {
        // All questions answered
        setStatus('result');
        // Award XP based on score
        const xpEarned = Math.floor((score + (isCorrect ? 1 : 0)) / questions.length * 50);
        if (xpEarned > 0) {
          updateXP(xpEarned);
        }
      }
    }, 1500);
  };

  // Handle close and reset
  const handleClose = () => {
    setStatus('idle');
    setScore(0);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setErrorMessage('');
    onClose();
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
            <BrainCircuit className="w-6 h-6" />
            Yapay Zeka Asistanı
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {bookTitle && (
            <div className="text-sm text-zinc-400">
              Kitap: <span className="text-zinc-300 font-medium">{bookTitle}</span>
            </div>
          )}

          {/* Idle State */}
          {status === 'idle' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <p className="text-zinc-300 text-center text-lg">
                Bu metni analiz edip senin için 3 hazırlık sorusu üretebilirim.
              </p>
              {!geminiApiKey && (
                <div className="w-full p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>API anahtarı gerekli. Lütfen ayarlardan API anahtarınızı girin.</span>
                  </div>
                </div>
              )}
              <Button
                onClick={handleStartAnalysis}
                disabled={!bookContent || !geminiApiKey}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BrainCircuit className="w-5 h-5 mr-2" />
                Analizi Başlat (AI)
              </Button>
            </div>
          )}

          {/* Loading State */}
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-16 h-16 text-purple-400 animate-spin" />
              <p className="text-zinc-300 text-center text-lg font-medium">
                Metin taranıyor... Ana fikirler çıkarılıyor...
              </p>
              <p className="text-zinc-500 text-center text-sm">
                Yapay zeka metni analiz ediyor ve sorular oluşturuyor...
              </p>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <XCircle className="w-16 h-16 text-red-400" />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-white">Hata Oluştu</h3>
                <p className="text-zinc-400 max-w-md">{errorMessage}</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setStatus('idle');
                    setErrorMessage('');
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white"
                >
                  Geri Dön
                </Button>
                <Button
                  onClick={handleStartAnalysis}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                >
                  Tekrar Dene
                </Button>
              </div>
            </div>
          )}

          {/* Quiz State */}
          {status === 'quiz' && currentQuestion && (
            <div className="space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-between text-sm text-zinc-400">
                <span>Soru {currentQuestionIndex + 1} / {questions.length}</span>
                <span>Skor: {score} / {currentQuestionIndex}</span>
              </div>

              <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700">
                <h3 className="text-xl font-bold text-white mb-6">
                  {currentQuestion.question}
                </h3>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === currentQuestion.answerIndex;
                    const showFeedback = isAnswered;

                    return (
                      <Button
                        key={index}
                        onClick={() => handleAnswerClick(index)}
                        disabled={isAnswered}
                        className={cn(
                          "w-full h-auto py-4 px-6 justify-start text-left border transition-all",
                          !isAnswered && "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700",
                          showFeedback && isSelected && isCorrect && "bg-green-900/50 border-green-500 text-green-400",
                          showFeedback && isSelected && !isCorrect && "bg-red-900/50 border-red-500 text-red-400",
                          showFeedback && !isSelected && "bg-zinc-800/30 border-zinc-700 text-zinc-500 opacity-50"
                        )}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <span className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-current text-sm font-bold">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="flex-1">{option}</span>
                          {showFeedback && isSelected && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          )}
                          {showFeedback && isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Result State */}
          {status === 'result' && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Tebrikler! Metni anlamaya hazırsın.
                </h3>
                <p className="text-zinc-400">
                  {score} / {questions.length} soru doğru
                </p>
              </div>

              {/* XP Reward */}
              <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-6 border border-purple-500/30">
                <div className="flex items-center justify-center gap-3">
                  <Trophy className="w-8 h-8 text-purple-400" />
                  <div>
                    <div className="text-sm text-zinc-400">XP Ödülü</div>
                    <div className="text-3xl font-bold text-purple-400">
                      +{Math.floor((score / questions.length) * 50)} XP
                    </div>
                  </div>
                </div>
              </div>

              {/* Save to Flashcards Button */}
              <Button
                onClick={() => {
                  // Save all questions as flashcards
                  questions.forEach((q, index) => {
                    const flashcard: Flashcard = {
                      id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
                      question: q.question,
                      answer: q.options[q.answerIndex],
                      options: q.options,
                      bookId: bookId,
                      createdAt: new Date().toISOString(),
                    };
                    saveFlashcard(flashcard);
                  });
                  setSaveToast(true);
                  setTimeout(() => setSaveToast(false), 3000);
                }}
                className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-lg border border-zinc-700"
              >
                <Bookmark className="w-5 h-5 mr-2" />
                💾 Karta Kaydet
              </Button>

              {/* Save Toast */}
              {saveToast && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[200] animate-fade-in">
                  <div className="bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Kart Kaydedildi!</span>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <Button
                onClick={handleClose}
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold text-lg"
              >
                Okumaya Dön
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
