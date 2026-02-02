'use client';

import { useState } from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

type ConfirmationQuizProps = {
  onComplete: (score: number) => void;
  onReport?: () => void;
};

const QUESTIONS = [
  {
    q: "Toplantı tutanağında 'Pazarlama Bütçesi' konuşulurken kullanılan dil hakkında hangisi doğrudur?",
    options: [
      'Tamamen onaylayıcı ve pozitifti.',
      "Rakamlar onaylandı ancak 'dikkatli harcanması' konusunda gergin bir uyarı yapıldı.",
      'Konu hiç konuşulmadı.',
    ],
    correct: 1,
  },
  {
    q: "Ahmet Bey'in 'CRM entegrasyonu' maddesindeki sorumluluğu nedir?",
    options: [
      'Sadece izlemek.',
      'Haftaya kadar raporlamak (Aksiyon Maddesi).',
      'BT ekibine devretmek.',
    ],
    correct: 1,
  },
] as const;

export default function ConfirmationQuiz({
  onComplete,
  onReport,
}: ConfirmationQuizProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const handleAnswer = (index: number) => {
    const question = QUESTIONS[currentStep];
    const isCorrect = index === question.correct;
    if (isCorrect) setScore((s) => s + 1);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      const total = score + (isCorrect ? 1 : 0);
      setFinalScore(total);
      setCompleted(true);
      onComplete(total);
    }
  };

  const handleRetry = () => {
    setCurrentStep(0);
    setScore(0);
    setCompleted(false);
    setFinalScore(null);
  };

  if (completed && finalScore !== null) {
    const success = finalScore === QUESTIONS.length;
    if (success) {
      return (
        <div className="bg-[#111] border border-white/10 rounded-[2rem] p-8 max-w-lg mx-auto">
          <div className="text-center p-8 bg-green-900/10 border border-green-500/20 rounded-[2rem]">
            <div className="w-20 h-20 bg-green-500 text-black rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Hafıza Onaylandı
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Bu toplantı tutanağındaki kritik kararları ve duygusal tonu
              başarıyla içselleştirdiniz.
            </p>
            <button
              type="button"
              onClick={onReport}
              className="px-6 py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition"
            >
              Yöneticiye Raporla
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-[#111] border border-white/10 rounded-[2rem] p-8 max-w-lg mx-auto">
        <div className="text-center p-8">
          <AlertTriangle
            className="text-orange-500 mx-auto mb-4 block"
            size={40}
          />
          <h2 className="text-xl text-white mb-2">Eksik Noktalar Var</h2>
          <p className="text-sm text-gray-500 mb-6">
            Özellikle &quot;Bütçe&quot; konusundaki tonu kaçırmış görünüyorsunuz.
            Hızlı okuma yerine &quot;Analitik Okuma&quot; moduyla tekrar deneyin.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition border border-white/20"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  const question = QUESTIONS[currentStep];

  return (
    <div className="bg-[#111] border border-white/10 rounded-[2rem] p-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="text-green-500 shrink-0" size={24} />
        <div>
          <h2 className="text-xl font-medium text-white">
            Kurumsal Hafıza Teyidi
          </h2>
          <p className="text-xs text-gray-500">
            Metnin içeriğini ve tonunu anladığınızı doğrulayın.
          </p>
        </div>
      </div>

      <div className="mb-8">
        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 block">
          Soru {currentStep + 1} / {QUESTIONS.length}
        </span>
        <h3 className="text-lg text-white font-light leading-snug">
          {question.q}
        </h3>
      </div>

      <div className="space-y-3">
        {question.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleAnswer(i)}
            className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-sm text-gray-300"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
