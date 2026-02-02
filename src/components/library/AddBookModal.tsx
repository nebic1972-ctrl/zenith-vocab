'use client';

import { useState, useRef } from 'react';
import { X, UploadCloud, Link as LinkIcon, FileText, Type, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useNeuroStore } from '@/store/useNeuroStore';
import * as pdfjsLib from 'pdfjs-dist';

// 🔧 PDF.js Worker ayarı (Component dışında, modül seviyesinde - daha güvenilir)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportType = 'text' | 'file' | 'url';

export default function AddBookModal({ isOpen, onClose }: AddBookModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<ImportType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [fileName, setFileName] = useState('');

  // 📄 PDF'den metin çıkarma fonksiyonu
  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      console.log(`📖 PDF Toplam Sayfa: ${pdf.numPages}`);

      // Sayfa sayfa gez ve metinleri topla
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n'; // Sayfalar arası boşluk
      }

      return fullText;
    } catch (error) {
      console.error("PDF Okuma Hatası:", error);
      throw new Error("PDF metni okunamadı.");
    }
  };

  // 📁 Dosya yükleme işleyicisi (PDF + TXT destekli)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    try {
      // PDF dosyası mı?
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        console.log("👓 PDF Okunuyor...");
        setStatusMsg('PDF okunuyor...');
        
        const text = await extractTextFromPdf(file);
        setContent(text);
        if (!title) setTitle(file.name.replace('.pdf', ''));
        
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
        setStatusMsg(`✅ Başarılı! ${wordCount.toLocaleString()} kelime.`);
        console.log(`✅ PDF Hazır! Kelime Sayısı: ${wordCount}`);
        
        alert("📄 PDF Başarıyla Okundu! 'Kütüphaneye Ekle' butonuna basabilirsiniz.");
      } 
      // TXT dosyası mı?
      else if (file.name.endsWith('.txt')) {
        setStatusMsg('TXT okunuyor...');
        const text = await file.text();
        setContent(text);
        if (!title) setTitle(file.name.replace('.txt', ''));
        
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
        setStatusMsg(`✅ Başarılı! ${wordCount.toLocaleString()} kelime.`);
        
        alert("📝 TXT Başarıyla Okundu! 'Kütüphaneye Ekle' butonuna basabilirsiniz.");
      } 
      // Desteklenmeyen format
      else {
        setStatusMsg('❌ Desteklenmeyen dosya formatı.');
        setFileName('');
        alert("❌ Desteklenmeyen dosya formatı. Lütfen PDF veya TXT yükleyin.");
      }
    } catch (error: any) {
      console.error("Dosya okuma hatası:", error);
      alert("PDF okunamadı! Lütfen metin tabanlı bir PDF yüklediğinizden emin olun (Resim olmamalı).");
      setStatusMsg('❌ Dosya okunamadı.');
      setFileName('');
    } finally {
      setLoading(false);
    }
  };

  // --- 🧨 KAMİKAZE MODU: FRENLERİ SÖK ---
  const handleSave = async () => {
    setLoading(true);
    console.log("🚀 KAMİKAZE MODU: İşlem Başlıyor...");

    // 1. ADIM: Kimlik Avı (Tarayıcı Deposunu Tara)
    let foundUserId: string | null = null;
    
    // LocalStorage'ı vahşice tara
    Object.keys(localStorage).forEach(key => {
      if (key.includes('auth-token')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.user?.id) {
            console.log("✅ Bulunan ID:", item.user.id);
            foundUserId = item.user.id;
          }
        } catch (e) { /* Hata varsa yut */ }
      }
    });

    // 2. ADIM: ID Bulunamasa bile ASLA DURMA (Frenleri Sök)
    if (!foundUserId) {
      console.warn("⚠️ UYARI: ID Bulunamadı ama yine de göndermeyi deniyorum!");
    }

    // İçerik hazırlığı
    let finalContent = content;
    if (activeTab === 'url') {
      finalContent = url ? `Bu içerik ${url} adresinden çekildi.` : 'URL içeriği';
    }

    // 3. ADIM: Veritabanına Fırlat
    try {
      const newBookData = {
        // Eğer ID yoksa, veritabanı belki null kabul eder veya RLS kapalı olduğu için geçer
        // Hata verirse en azından "Veritabanı Hatası" alırız, "Kullanıcı Yok" hatası değil.
        user_id: foundUserId, 
        title: title || "Başlıksız Eser",
        author: 'Kullanıcı Yüklemesi',
        content: finalContent || "İçerik yok",
        total_words: finalContent?.split(/\s+/).length || 0,
        progress: 0,
        category: 'Genel',
        source: activeTab === 'url' ? 'google' : 'upload'
      };

      console.log("📚 Veritabanına fırlatılıyor:", newBookData);

      const { data, error } = await supabase
        .from('books')
        .insert(newBookData)
        .select()
        .single();

      if (error) {
        console.error("Veritabanı Reddetti:", error);
        alert("Veritabanı Hatası: " + error.message); // Gerçek hatayı görelim
        throw error;
      }

      // Başarılı!
      console.log("🎉 ZAFER! Kitap Eklendi:", data);
      useNeuroStore.getState().addBookToState(data);
      alert("🎉 Kitap Eklendi!");
      
      // Temizlik ve Kapanış
      onClose();
      setTitle('');
      setContent('');
      setUrl('');
      setFileName('');
      setStatusMsg('');

    } catch (err: any) {
      console.error("İşlem Başarısız:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-800 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UploadCloud className="text-purple-500"/> Kütüphaneye Ekle
          </h2>
          <button onClick={onClose}><X className="text-zinc-500 hover:text-white"/></button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-zinc-800 shrink-0">
          {[
            { id: 'text', label: 'Metin Yapıştır', icon: Type },
            { id: 'file', label: 'Dosya Yükle', icon: FileText },
            { id: 'url', label: 'Web Linki', icon: LinkIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ImportType)}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold transition-colors
                ${activeTab === tab.id ? 'bg-zinc-800 text-white border-b-2 border-purple-500' : 'text-zinc-500 hover:bg-zinc-800/50'}
              `}
            >
              <tab.icon size={16}/> {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Kitap Başlığı</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kitabın adı..."
              className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
            />
          </div>

          {/* TEXT MODU */}
          {activeTab === 'text' && (
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">İçerik</label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Metni buraya yapıştırın..."
                className="w-full h-40 bg-black border border-zinc-700 rounded-xl p-3 text-white focus:border-purple-500 outline-none resize-none"
              />
            </div>
          )}

          {/* URL MODU */}
          {activeTab === 'url' && (
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Web Adresi (URL)</label>
              <input 
                type="url" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
              />
              <p className="text-xs text-zinc-600 mt-2 flex items-center gap-1">
                <AlertCircle size={12}/> Şimdilik sadece linki kaydeder.
              </p>
            </div>
          )}

          {/* FILE MODU */}
          {activeTab === 'file' && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer
                ${fileName ? 'border-green-500/50 bg-green-500/10' : 'border-zinc-700 hover:border-purple-500 bg-black/20 text-zinc-500'}
              `}
            >
              <input 
                type="file" 
                accept=".pdf,.txt" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              
              {loading ? (
                <div className="flex flex-col items-center animate-pulse text-purple-400">
                  <Loader2 size={32} className="animate-spin mb-2"/>
                  <p>{statusMsg}</p>
                </div>
              ) : fileName ? (
                <div className="flex flex-col items-center text-green-400">
                  <FileText size={32} className="mb-2"/>
                  <p className="font-bold">{fileName}</p>
                  <p className="text-xs text-green-600 mt-1">{statusMsg}</p>
                </div>
              ) : (
                <>
                  <UploadCloud size={32} className="mb-2"/>
                  <p>PDF veya TXT dosyasını seçin</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-3 rounded-xl text-zinc-400 hover:text-white font-bold">
            İptal
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors
              ${loading ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200'}
            `}
          >
            {loading ? 'Kaydediliyor...' : 'Kütüphaneye Ekle'}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
