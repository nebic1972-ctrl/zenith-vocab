'use client';

import { useState } from 'react';
import { Upload, Zap, CheckSquare, PlayCircle } from 'lucide-react';
import { analyzeMeetingNotes, type MeetingAnalysis } from '@/lib/nlpEngine';
import { extractTextFromPDF } from '@/lib/pdfProcessor';
import { useRouter } from 'next/navigation';
import { useNeuroStore } from '@/store/useNeuroStore';
import type { Book } from '@/store/useNeuroStore';

export default function MeetingProcessor() {
  const [analysis, setAnalysis] = useState<MeetingAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setActiveBook = useNeuroStore((s) => s.setActiveBook);

  const extractText = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      const result = await extractTextFromPDF(file);
      return result.text;
    }
    if (ext === 'txt') return file.text();
    throw new Error('Sadece .txt ve .pdf desteklenir.');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const rawText = await extractText(file);
      if (!rawText?.trim()) {
        setError('Dosya boş veya metin çıkarılamadı.');
        setLoading(false);
        return;
      }
      const result = await analyzeMeetingNotes(rawText);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const startSpeedReading = () => {
    if (!analysis) return;
    const words = analysis.cleanText.split(/\s+/).filter((w) => w.length > 0);
    const book: Book = {
      id: `meeting-${Date.now()}`,
      title: 'Toplantı Özeti & Analizi',
      content: analysis.cleanText,
      author: 'Kurumsal NLP',
      progress: 0,
      total_words: words.length,
    };
    setActiveBook(book);
    router.push('/reader');
  };

  return (
    <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8">
      {!analysis ? (
        <div className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center hover:border-blue-500/50 transition-colors">
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            id="meeting-upload"
            accept=".txt,.pdf"
          />
          <label
            htmlFor="meeting-upload"
            className={`cursor-pointer flex flex-col items-center ${loading ? 'pointer-events-none' : ''}`}
          >
            <div
              className={`p-4 rounded-full mb-4 shrink-0 ${
                loading ? 'bg-blue-500/20 animate-pulse' : 'bg-white/5'
              }`}
            >
              {loading ? (
                <Zap className="text-blue-400" size={24} />
              ) : (
                <Upload className="text-gray-400" size={24} />
              )}
            </div>
            <h3 className="text-white font-medium mb-2">
              {loading ? 'NLP İşleniyor...' : 'Tutanak / Rapor Yükle'}
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mb-2">
              Yapay zeka metni temizleyecek, aksiyonları çıkaracak ve hızlı okuma
              için optimize edecek.
            </p>
            <span className="text-[10px] text-gray-600">.txt veya .pdf</span>
            {error && (
              <p className="mt-3 text-xs text-red-400 font-medium">{error}</p>
            )}
          </label>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl text-white font-medium mb-1">
                Analiz Tamamlandı
              </h2>
              <div className="flex flex-wrap gap-2">
                {analysis.keyTopics.map((topic) => (
                  <span
                    key={topic}
                    className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md font-bold uppercase"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-mono text-white">
                {analysis.readingTime} dk
              </div>
              <div className="text-[10px] text-gray-500 uppercase font-bold">
                Tahmini Süre
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-5 mb-6">
            <h4 className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase mb-3">
              <CheckSquare size={14} className="text-green-500 shrink-0" />
              Aksiyon Maddeleri
            </h4>
            <ul className="space-y-2">
              {analysis.actionItems.map((item, i) => (
                <li
                  key={i}
                  className="text-sm text-gray-400 pl-6 relative before:absolute before:left-2 before:top-2 before:w-1.5 before:h-1.5 before:bg-green-500/50 before:rounded-full before:content-['']"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={startSpeedReading}
            className="w-full py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition"
          >
            <PlayCircle size={18} className="shrink-0" /> Hızlı Okuma Modunda
            Başlat
          </button>
        </div>
      )}
    </div>
  );
}
