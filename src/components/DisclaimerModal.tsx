"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldAlert, CheckCircle2 } from "lucide-react";

interface DisclaimerModalProps {
  onAccept: () => void;
}

export function DisclaimerModal({ onAccept }: DisclaimerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Daha önce kabul ettiyse tekrar gösterme (LocalStorage)
    const accepted = localStorage.getItem("neuro_read_legal_accepted");
    if (!accepted) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("neuro_read_legal_accepted", "true");
    setIsOpen(false);
    onAccept();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl bg-zinc-900 border-zinc-800 p-8 shadow-2xl relative">
        
        <div className="flex flex-col items-center text-center space-y-4 mb-6">
          <div className="p-4 bg-yellow-500/10 rounded-full border border-yellow-500/20">
             <ShieldAlert className="w-12 h-12 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-black text-white">Yasal Uyarı ve Sorumluluk Reddi</h2>
        </div>

        <div className="h-64 overflow-y-auto bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-sm text-zinc-400 space-y-4 mb-6 text-left">
          <p className="font-bold text-white">Lütfen uygulamayı kullanmadan önce dikkatlice okuyunuz:</p>
          
          <p><strong>1. TIBBİ CİHAZ DEĞİLDİR:</strong> Neuro-Read platformu ("Yazılım"), yalnızca okuma hızını ve dikkat yönetimini geliştirmeyi amaçlayan bir <u>destekleyici eğitim aracıdır</u>. Bu yazılım, herhangi bir hastalığı (Göz Tembelliği, DEHB/ADHD, Disleksi vb.) teşhis etmez, tedavi etmez, iyileştirmez veya önlemez. Tıbbi bir tavsiye veya tedavi yerine geçmez.</p>
          
          <p><strong>2. KULLANICI SORUMLULUĞU:</strong> Yazılımın sunduğu "Görsel Destek Modu" veya "Yüksek Odak Modu" gibi özellikler, literatürdeki görsel tekniklerden esinlenerek hazırlanmış eğitimsel arayüz tercihleridir. Sağlık sorunlarınız için lütfen mutlaka uzman bir hekime başvurunuz.</p>
          
          <p><strong>3. VERİ GÜVENLİĞİ (KVKK/GDPR):</strong> Toplanan veriler (okuma hızı, anlama oranı vb.) anonim olarak işlenir ve yalnızca kişisel gelişim takibi amacıyla kullanılır. Üçüncü taraflarla ticari amaçla paylaşılmaz.</p>

          <p><strong>4. SONUÇ GARANTİSİ YOKTUR:</strong> Bireysel sonuçlar; kullanıcının mevcut bilişsel durumu, düzenli kullanımı ve diğer faktörlere göre değişiklik gösterebilir.</p>
        </div>

        <Button onClick={handleAccept} size="lg" className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-6 text-base">
          <CheckCircle2 className="w-5 h-5 mr-2" /> Okudum, Anladım ve Kabul Ediyorum
        </Button>
      </Card>
    </div>
  );
}
