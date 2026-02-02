"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrainCircuit, Loader2, CheckCircle2, XCircle, Trophy } from "lucide-react";
// @ts-ignore
import confetti from "canvas-confetti";
import { supabase } from "@/lib/supabase";
import { useNeuroStore } from "@/store/useNeuroStore";

interface AIQuizProps {
  text: string;
  wpm: number; // ✅ YENİ EKLENDİ: Hız bilgisini bekliyoruz
  onClose: () => void;
}

export function AIQuiz({ text, wpm, onClose }: AIQuizProps) {
  const { user } = useNeuroStore();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const generateQuiz = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      setQuestions(data);
      setQuizStarted(true);
    } catch (error: any) {
        console.error(error);
        setErrorMsg("Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (isAnswered) return;

    setSelectedOption(optionIndex);
    setIsAnswered(true);

    const isCorrect = optionIndex === questions[currentQuestion].answer;
    
    // ✅ DÜZELTME: Skoru doğru hesapla (State güncellenmeden önce anlık hesaplama)
    const currentCorrectCount = isCorrect ? score + 1 : score;
    
    if (isCorrect) {
        setScore(currentCorrectCount);
    }

    // 1.5 Saniye Bekle ve İlerle
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        // --- TEST BİTTİ ---
        setShowResult(true);

        // 1. Veritabanına Kaydet
        if (user) {
            const newScore = currentCorrectCount; // Toplam doğru sayısı
            const finalScore = Math.round((newScore / questions.length) * 100);
            
            const saveScore = async () => {
                try {
                    const { error } = await supabase.from("readings").insert({
                        user_id: user.id,
                        wpm: wpm, // Okuma hızı
                        quiz_score: finalScore, // Başarı yüzdesi
                        quiz_total: questions.length,
                        quiz_correct: newScore,
                        text_content: text.slice(0, 50)
                    });

                    if (error) {
                        console.error("Supabase Hatası:", error);
                    } else {
                        console.log("💾 Skor başarıyla kaydedildi! Hız:", wpm, "Puan:", finalScore);
                    }
                } catch (err) {
                    console.error("Kayıt hatası:", err);
                }
            };
            saveScore();
        }

        // 2. Konfeti Patlat (Başarılıysa - %60 üzeri)
        if (currentCorrectCount > questions.length / 2) {
            triggerConfetti();
        }
      }
    }, 1500);
  };

  // 1. Başlangıç Ekranı
  if (!quizStarted) {
    return (
      <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <Card className="w-full max-w-md p-8 bg-zinc-900 border-zinc-800 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
          <BrainCircuit className="w-20 h-20 mx-auto text-purple-500 mb-6 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Hazır mısın?</h2>
          <p className="text-zinc-400 mb-6">
            Yapay Zeka senin için 3 soru hazırladı. Bakalım ne kadar dikkatlisin?
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={generateQuiz} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg">
              {loading ? <Loader2 className="animate-spin" /> : "🚀 Testi Başlat"}
            </Button>
            <Button variant="ghost" onClick={onClose}>Kapat</Button>
          </div>
        </Card>
      </div>
    );
  }

  // 3. Sonuç Ekranı
  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    let message = "";
    let color = "";
    if (percentage === 100) { message = "Mükemmelsin! 🧠🔥"; color = "text-green-500"; }
    else if (percentage >= 60) { message = "Gayet İyi! 👍"; color = "text-blue-400"; }
    else { message = "Biraz Daha Dikkat. 📚"; color = "text-orange-400"; }

    return (
      <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <Card className="w-full max-w-md p-8 bg-zinc-900 border-zinc-800 text-center animate-in zoom-in">
          <Trophy className={`w-24 h-24 mx-auto mb-6 ${percentage >= 60 ? 'text-yellow-500' : 'text-zinc-600'}`} />
          <h2 className="text-4xl font-bold text-white mb-2">{score} / {questions.length}</h2>
          <p className={`text-xl font-medium mb-4 ${color}`}>{message}</p>
          <p className="text-sm text-zinc-400 mb-6">
            Okuma Hızın: <span className="text-white font-bold">{wpm} WPM</span>
          </p>
          <div className="w-full bg-zinc-800 h-2 rounded-full mb-6 overflow-hidden">
            <div 
                className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-1000"
                style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <Button onClick={onClose} className="w-full bg-white text-black hover:bg-zinc-200 py-4">
              Ana Menüye Dön
          </Button>
        </Card>
      </div>
    );
  }

  // 2. Soru Ekranı
  const q = questions[currentQuestion];
  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <Card className="w-full max-w-2xl p-8 bg-zinc-900 border-zinc-800 relative">
        <div className="absolute top-0 left-0 h-1 bg-purple-600 transition-all duration-500" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}></div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-purple-400 font-mono text-sm">Soru {currentQuestion + 1}/{questions.length}</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-8 leading-relaxed">{q.question}</h3>
        <div className="grid grid-cols-1 gap-4">
          {q.options.map((option: string, index: number) => {
            let btnClass = "border-zinc-700 hover:bg-zinc-800 text-zinc-300";
            let icon = null;
            if (isAnswered) {
                if (index === q.answer) {
                    btnClass = "border-green-500 bg-green-500/10 text-green-400";
                    icon = <CheckCircle2 className="w-5 h-5 ml-auto text-green-500" />;
                } else if (index === selectedOption) {
                    btnClass = "border-red-500 bg-red-500/10 text-red-400";
                    icon = <XCircle className="w-5 h-5 ml-auto text-red-500" />;
                } else { btnClass = "border-zinc-800 opacity-50"; }
            }
            return (
                <Button key={index} variant="outline" onClick={() => handleAnswer(index)} disabled={isAnswered} className={`justify-start text-left h-auto py-4 px-4 text-lg transition-all ${btnClass}`}>
                    <span className="w-8 h-8 rounded-full border border-current flex items-center justify-center mr-4 text-sm font-mono opacity-70">{String.fromCharCode(65 + index)}</span>
                    {option}
                    {icon}
                </Button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
