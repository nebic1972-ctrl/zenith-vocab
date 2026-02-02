"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Eye, GraduationCap, CheckCircle2, AlertTriangle, Activity, ChevronDown, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNeuroStore } from "@/store/useNeuroStore";

// --- TEST VERİSİ (Aynı kalıyor) ---
const STAGES = [
  {
    speed: 200,
    color: "text-green-400",
    bg: "bg-green-500",
    text: "Okuma eylemi, sadece gözlerin kelimeleri taraması değil, beynin bu sembolleri anlamlandırma sürecidir. Gözlerimiz satır üzerinde 'sakkad' adı verilen sıçramalar yapar ve duraksadığında (fiksasyon) bilgiyi alır. İyi bir okuyucu, fiksasyon süresini kısaltıp görme alanını genişleterek beynine daha hızlı veri akışı sağlar.",
    questions: [
        { q: "Okuma sürecinde gözün yaptığı sıçramalara ne ad verilir?", options: ["Fiksasyon", "Sakkad", "Korteks"], ans: 1 },
        { q: "Bilgi alımı gözün hangi hareketi sırasında gerçekleşir?", options: ["Sıçrama anında", "Duraksama (fiksasyon) anında", "Göz kırpma anında"], ans: 1 },
        { q: "İyi bir okuyucunun temel özelliği nedir?", options: ["Daha yavaş okumak", "Görme alanını genişletmek", "Sesli okumak"], ans: 1 }
    ]
  },
  {
    speed: 400,
    color: "text-yellow-400",
    bg: "bg-yellow-500",
    text: "Hızlı okuma, iç seslendirmeyi (subvocalization) bastırmayı gerektirir. Çoğu insan okurken kelimeleri zihninde telaffuz eder, bu da hızı konuşma hızıyla sınırlar. Oysa beyin, gözün gördüğü görüntüyü sese dönüştürmeden, doğrudan kavramsal olarak işleyebilir. Bu, 'görsel okuma' olarak adlandırılır.",
    questions: [
        { q: "Hızlı okumanın önündeki en büyük engel nedir?", options: ["Göz bozukluğu", "İç seslendirme (Subvocalization)", "Kelime hazinesi"], ans: 1 },
        { q: "İç seslendirme okuma hızını ne ile sınırlar?", options: ["Konuşma hızıyla", "Düşünme hızıyla", "Yazma hızıyla"], ans: 0 },
        { q: "Beynin görüntüyü sese dönüştürmeden işlemesine ne denir?", options: ["İşitsel okuma", "Görsel okuma", "Dokunsal okuma"], ans: 1 }
    ]
  },
  {
    speed: 600,
    color: "text-orange-400",
    bg: "bg-orange-500",
    text: "Nöro-plastisite, beynin yeni hızlara adapte olabilme yeteneğidir. Hız arttıkça beyin, detayları yakalamaktan ziyade 'anahtar kelimeleri' ve 'bağlamı' filtrelemeye başlar. Tıpkı hızlanan bir arabadayken yoldaki çakıl taşlarını değil, sadece virajları ve diğer araçları görmemiz gibi, beyin de gereksiz bağlaçları elemeyi öğrenir.",
    questions: [
        { q: "Beynin adaptasyon yeteneğine ne ad verilir?", options: ["Nöro-plastisite", "Nöro-dejenerasyon", "Psiko-analiz"], ans: 0 },
        { q: "Hız arttığında beyin neye odaklanır?", options: ["Her harfe", "Bağlaçlara", "Anahtar kelimelere ve bağlama"], ans: 2 },
        { q: "Metindeki araba analojisi neyi anlatmaktadır?", options: ["Yol güvenliğini", "Gereksiz detayların elenmesini", "Araba kullanmanın zorluğunu"], ans: 1 }
    ]
  },
  {
    speed: 800,
    color: "text-red-500",
    bg: "bg-red-500",
    text: "Maksimum bilişsel yük altında, 'çalışan hafıza' (working memory) darboğaz oluşturabilir. Bu seviyede okuma artık lineer bir süreçten çıkıp, bütüncül bir tarama işlemine dönüşür. Anlama oranı %100 olmak zorunda değildir; %70'lik bir 'ana fikir' kavrayışı, bu hızdaki bir tarama için başarılı (valid) kabul edilir.",
    questions: [
        { q: "Bu hızda darboğazı oluşturan bilişsel unsur nedir?", options: ["Uzun süreli hafıza", "Çalışan hafıza (Working memory)", "Refleksler"], ans: 1 },
        { q: "800 WPM seviyesinde okuma nasıl bir sürece dönüşür?", options: ["Lineer (Doğrusal)", "Bütüncül tarama", "Heceleme"], ans: 1 },
        { q: "Bu hız için 'geçerli' (valid) kabul edilen anlama oranı nedir?", options: ["%100", "%90", "%70 ve üzeri"], ans: 2 }
    ]
  }
];

export function DiagnosticTest({ onComplete }: { onComplete: () => void }) {
  const { user } = useNeuroStore();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ age: "", education: "", vision: "" });
  
  // Test State'leri
  const [stageIndex, setStageIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, number[]>>({});

  const currentStage = STAGES[stageIndex];
  const words = currentStage.text.split(" ");

  // --- 🛠️ DÜZELTİLMİŞ RSVP MOTORU ---
  useEffect(() => {
    let interval: any;

    // Sadece 'isPlaying' true ise ve kelimeler bitmediyse çalışır
    if (isPlaying && wordIndex < words.length) {
      // Hız formülü: 60000 ms / WPM
      const speedMs = 60000 / currentStage.speed;
      
      interval = setInterval(() => {
        setWordIndex((prevIndex) => {
          if (prevIndex >= words.length - 1) {
            setIsPlaying(false); // Durdur
            return prevIndex;
          }
          return prevIndex + 1;
        });
      }, speedMs);
    } 

    return () => clearInterval(interval);
    // Dependency array'e 'currentStage.speed' ekledik. Hız değişince interval resetlenir.
  }, [isPlaying, currentStage.speed, words.length]); 

  const handleStageSubmit = () => {
    if (stageIndex < STAGES.length - 1) {
        // Sonraki aşamaya geçiş
        setStageIndex(prev => prev + 1);
        setWordIndex(0); // Kelimeleri başa sar
        
        // React state güncellemeleri asenkron olduğu için küçük bir gecikme ile başlat
        setTimeout(() => setIsPlaying(true), 100); 
    } else {
        setStep(4); // Test bitti
    }
  };

  const handleAnswer = (qIdx: number, ansIdx: number) => {
    const currentStageAnswers = userAnswers[stageIndex] || Array(3).fill(-1);
    currentStageAnswers[qIdx] = ansIdx;
    setUserAnswers({ ...userAnswers, [stageIndex]: currentStageAnswers });
  };

  const finishTest = async () => {
    if (!user) return;

    let validMaxSpeed = 200;
    STAGES.forEach((stage, sIdx) => {
        const stageAnswers = userAnswers[sIdx] || [];
        const correctCount = stage.questions.reduce((acc, q, qIdx) => {
            return acc + (stageAnswers[qIdx] === q.ans ? 1 : 0);
        }, 0);
        if (correctCount >= 2) validMaxSpeed = stage.speed;
    });

    let mastery = 'novice';
    if (validMaxSpeed >= 800) mastery = 'genius';
    else if (validMaxSpeed >= 600) mastery = 'elite';
    else if (validMaxSpeed >= 400) mastery = 'adept';

    const { error } = await supabase.from("user_profiles").upsert({
      user_id: user.id,
      age_range: profile.age,
      education_level: profile.education,
      visual_condition: profile.vision,
      base_wpm: Math.max(200, validMaxSpeed - 100),
      target_wpm: Math.round(validMaxSpeed * 1.3),
      mastery_level: mastery,
      max_comprehension_speed: validMaxSpeed
    });

    if (!error) onComplete();
  };

  const isStageReadingFinished = !isPlaying && wordIndex > 0; // Word index 0'dan büyükse ve durduysa bitmiştir

  return (
    <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
      <Card className="max-w-3xl w-full bg-zinc-900 border-zinc-800 p-8 shadow-2xl relative overflow-hidden min-h-[600px] flex flex-col">
        
        {/* --- ADIM 1: DEMOGRAFİ --- */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
             <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Profil Kalibrasyonu</h2>
              <p className="text-zinc-400 text-sm">Reliable (Güvenilir) bir test sonucu için lütfen doğru bilgileri giriniz.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-zinc-300 text-xs font-bold flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Eğitim Seviyesi</label>
                    <div className="relative">
                        <select 
                            className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-md p-3 appearance-none focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            onChange={(e) => setProfile({...profile, education: e.target.value})}
                            defaultValue=""
                        >
                            <option value="" disabled>Seçiniz</option>
                            <option value="lise">Lise ve Altı</option>
                            <option value="lisans">Üniversite (Lisans)</option>
                            <option value="akademik">Yüksek Lisans / Doktora</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-zinc-300 text-xs font-bold flex items-center gap-2"><Eye className="w-4 h-4" /> Göz Durumu</label>
                    <div className="relative">
                        <select 
                            className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-md p-3 appearance-none focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            onChange={(e) => setProfile({...profile, vision: e.target.value})}
                            defaultValue=""
                        >
                            <option value="" disabled>Seçiniz</option>
                            <option value="saglikli">Sorun Yok / Gözlükle Tam Görüş</option>
                            <option value="goz_tembelligi">Görsel Destek İhtiyacı / Odak Sorunu</option>
                            <option value="renk_korlugu">Renk Körlüğü</option>
                            <option value="kisitli">Az Görme (Low Vision)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-zinc-300 text-xs font-bold flex items-center gap-2">Yaş Aralığı</label>
                    <div className="relative">
                        <select 
                            className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-md p-3 appearance-none focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            onChange={(e) => setProfile({...profile, age: e.target.value})}
                            defaultValue=""
                        >
                            <option value="" disabled>Seçiniz</option>
                            <option value="18-24">18 - 24</option>
                            <option value="25-34">25 - 34</option>
                            <option value="35-50">35 - 50</option>
                            <option value="50+">50 ve üzeri</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                </div>
            </div>

            <Button disabled={!profile.education || !profile.vision || !profile.age} onClick={() => setStep(2)} className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold">
                Devam Et
            </Button>
          </div>
        )}

        {/* --- ADIM 2: INTRO --- */}
        {step === 2 && (
             <div className="text-center space-y-6 py-10 animate-in zoom-in">
                <Activity className="w-16 h-16 mx-auto text-purple-500 animate-pulse" />
                <h2 className="text-3xl font-black text-white">VALIDITY CHECK</h2>
                <p className="text-zinc-400 text-lg px-4">
                    Test 4 aşamadan oluşur. Her aşamada hız artar ve sonunda <span className="text-purple-400 font-bold">3 Soru</span> sorulur.
                    <br/><br/>
                    <span className="text-xs text-zinc-500">Bir hızı geçmiş sayılmak için 3 sorudan en az 2'sini bilmeniz gerekir.</span>
                </p>
                <Button onClick={() => { setStep(3); setIsPlaying(true); }} className="w-full py-6 text-xl bg-white text-black font-bold">TESTİ BAŞLAT</Button>
            </div>
        )}

        {/* --- ADIM 3: AKTİF OKUMA VE SORULAR --- */}
        {step === 3 && (
            <div className="flex flex-col h-full">
                
                {/* Hız Göstergesi (Header) */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-1">
                        {STAGES.map((_, idx) => (
                             <div key={idx} className={`h-2 w-8 rounded-full transition-all ${idx <= stageIndex ? currentStage.bg : 'bg-zinc-800'}`} />
                        ))}
                    </div>
                    <div className={`font-black text-2xl flex items-center gap-2 ${currentStage.color}`}>
                        <Zap className="w-5 h-5" fill="currentColor" /> {currentStage.speed} WPM
                    </div>
                </div>

                {!isStageReadingFinished ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                         {/* RSVP Kelime Alanı */}
                         <div className="text-5xl md:text-6xl font-black text-white text-center min-h-[120px] flex items-center justify-center">
                            {words[wordIndex]}
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-100 ease-linear ${currentStage.bg}`} style={{ width: `${(wordIndex / words.length) * 100}%` }} />
                        </div>
                    </div>
                ) : (
                    /* SORU MODU */
                    <div className="flex-1 overflow-y-auto space-y-6 animate-in slide-in-from-bottom">
                        <div className={`bg-opacity-10 border border-opacity-20 p-4 rounded-lg flex items-center gap-3 ${currentStage.bg.replace('bg-', 'bg-')} ${currentStage.color.replace('text-', 'border-')}`}>
                            <AlertTriangle className={`w-5 h-5 ${currentStage.color}`} />
                            <p className="text-sm text-zinc-300">Bu hız seviyesini geçmek için aşağıdaki 3 soruyu cevaplayın.</p>
                        </div>

                        {currentStage.questions.map((q, qIdx) => (
                            <div key={qIdx} className="space-y-3">
                                <p className="text-white font-medium text-lg">{qIdx + 1}. {q.q}</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {q.options.map((opt, optIdx) => {
                                        const isSelected = userAnswers[stageIndex]?.[qIdx] === optIdx;
                                        return (
                                            <Button 
                                                key={optIdx} 
                                                variant="outline" 
                                                className={`justify-start h-auto py-3 px-4 text-sm ${isSelected ? `border-purple-500 bg-purple-500/20 text-white` : "border-zinc-800 text-zinc-400"}`}
                                                onClick={() => handleAnswer(qIdx, optIdx)}
                                            >
                                                {opt}
                                            </Button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}

                        <Button 
                            disabled={!userAnswers[stageIndex] || userAnswers[stageIndex].includes(-1) || userAnswers[stageIndex].length < 3}
                            onClick={handleStageSubmit} 
                            className={`w-full py-6 font-bold text-white mt-4 ${currentStage.bg} hover:opacity-90`}
                        >
                            {stageIndex < 3 ? "Cevapları Onayla ve Hızlan" : "Testi Bitir ve Analiz Et"}
                        </Button>
                    </div>
                )}
            </div>
        )}

        {/* --- ADIM 4: SONUÇ ANALİZ --- */}
        {step === 4 && (
             <div className="text-center space-y-6 py-10 animate-in zoom-in">
                <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
                <h2 className="text-3xl font-black text-white">ANALİZ TAMAMLANDI</h2>
                <p className="text-zinc-400">Verileriniz Reliability ve Validity testlerinden geçirildi ve profiliniz oluşturuldu.</p>
                <Button onClick={finishTest} className="w-full py-6 text-xl bg-white text-black font-bold">SONUÇLARI KAYDET</Button>
            </div>
        )}

      </Card>
    </div>
  );
}