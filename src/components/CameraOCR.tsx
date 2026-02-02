"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, ImagePlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import Tesseract from 'tesseract.js';

interface CameraOCRProps {
  onTextLoaded: (text: string) => void;
}

export function CameraOCR({ onTextLoaded }: CameraOCRProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatus("Görüntü taranıyor...");

    try {
      const result = await Tesseract.recognize(
        file,
        'tur', // Türkçe dil desteği
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setStatus(`Okunuyor... %${Math.round(m.progress * 100)}`);
            }
          },
        }
      );

      const text = result.data.text;
      
      if (text && text.trim().length > 0) {
        onTextLoaded(text);
        setStatus("Tamamlandı!");
      } else {
        alert("Resimde okunabilir bir yazı bulunamadı.");
      }

    } catch (error) {
      console.error(error);
      alert("Görüntü işlenirken hata oluştu.");
    } finally {
      setIsProcessing(false);
      setStatus("");
    }
  };

  return (
    <Card className="p-4 bg-zinc-900/50 border-zinc-800 mb-6">
      <div className="flex flex-col items-center gap-4">
        
        {/* Gizli Input (Hem Dosya Hem Kamera Destekler) */}
        <input
          type="file"
          accept="image/*"
          capture="environment" // Mobilde direkt arka kamerayı açar
          id="camera-input"
          className="hidden"
          onChange={handleImageUpload}
        />

        <label 
          htmlFor="camera-input" 
          className={`
            flex items-center gap-3 px-6 py-4 rounded-xl cursor-pointer transition-all w-full justify-center
            ${isProcessing 
              ? "bg-zinc-800 text-zinc-500 cursor-wait" 
              : "bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 text-white shadow-lg shadow-blue-900/20"
            }
          `}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="font-mono">{status}</span>
            </>
          ) : (
            <>
              <Camera className="w-6 h-6" />
              <span className="font-bold text-lg">Kamerayla Tara / Resim Yükle</span>
            </>
          )}
        </label>
        
        <p className="text-xs text-zinc-500 text-center">
          Kitap sayfası, belge veya ekran görüntüsü yükleyebilirsiniz.
        </p>
      </div>
    </Card>
  );
}
