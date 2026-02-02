import { useState, useEffect, useCallback } from 'react';

export default function useVoiceControl(commands: Record<string, () => void>) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [support, setSupport] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && !('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSupport(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (!support) {
      alert("Tarayıcın sesli komutu desteklemiyor (Chrome kullanmalısın).");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true; // Sürekli dinle
    recognition.lang = 'tr-TR'; // Türkçe anla
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      const text = lastResult[0].transcript.trim().toLowerCase();
      setTranscript(text);

      // Komutları Kontrol Et
      console.log("Duyulan:", text);
      
      // Anahtar kelimeleri tara
      Object.keys(commands).forEach((cmd) => {
        if (text.includes(cmd)) {
          commands[cmd](); // Komutu çalıştır
        }
      });
    };

    recognition.onerror = (event: any) => {
      console.error("Ses Hatası:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isListening, support, commands]);

  return { isListening, toggleListening, transcript, support };
}
