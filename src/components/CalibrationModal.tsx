"use client";

import { useState, useEffect } from "react";
// Supabase'i şimdilik kullanmıyoruz, hata vermesin diye kaldırdık veya yorum satırı yaptık
// import { supabase } from "@/lib/supabase"; 

export default function CalibrationModal() {
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);

  // Test Metni
  const text = "Okuma hızınızı ölçmek için bu metni normal hızınızda okuyun. Her kelimeyi okuduğunuzda ekrana tıklayın.";

  useEffect(() => {
    // Sayfa yüklendiğinde modal açılsın
    setIsOpen(true);
  }, []);

  const handleTap = () => {
    if (step === 0) {
      setStartTime(Date.now());
    }

    if (step < text.split(" ").length - 1) {
      setStep(step + 1);
    } else {
      finishTest();
    }
  };

  const finishTest = () => {
    if (startTime) {
      const durationInSeconds = (Date.now() - startTime) / 1000;
      const words = text.split(" ").length;
      const calculatedWpm = Math.round((words / durationInSeconds) * 60);
      setWpm(calculatedWpm);
      
      // Hız sonucunu burada veritabanına kaydedebiliriz (şimdilik sadece gösteriyoruz)
      setStep(step + 1); // Sonuç ekranına geç
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#111] border border-white/10 shadow-2xl overflow-hidden">
        
        {/* Adım 1: Test Aşaması */}
        {step < text.split(" ").length ? (
          <div onClick={handleTap} className="cursor-pointer py-16 px-8 text-center select-none active:scale-95 transition-transform">
            <h2 className="text-xl font-medium text-gray-400 mb-8 uppercase tracking-widest">Hız Testi</h2>
            <div className="text-5xl md:text-6xl font-black text-white mb-8">
              {text.split(" ")[step]}
            </div>
            <p className="text-sm text-gray-500 animate-pulse">
              Kelimeyi okuyunca ekrana dokun/tıkla
            </p>
          </div>
        ) : (
          
          /* Adım 2: Sonuç Ekranı (BUTON BURADA) */
          <div className="py-12 px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Harika! 🎉</h2>
            <p className="text-gray-400 mb-8">Başlangıç hızın tespit edildi.</p>
            
            <div className="flex justify-center items-end gap-2 mb-8">
              <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                {wpm}
              </span>
              <span className="text-xl text-gray-500 font-medium mb-4">Kelime/Dk</span>
            </div>

            {/* 👇 İŞTE EKLENEN BUTON 👇 */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-all active:scale-95"
            >
              Tamam, Başla 🚀
            </button>
            {/* 👆 BUTON BİTTİ 👆 */}

          </div>
        )}
      </div>
    </div>
  );
}