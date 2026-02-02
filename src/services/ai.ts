import { GoogleGenerativeAI } from "@google/generative-ai";
import { useNeuroStore } from "@/store/useNeuroStore";

// Yedek (Demo) Sorular - Eğer API anahtarı yoksa veya hata olursa bunlar gelir.
const FALLBACK_QUESTIONS = [
  {
    id: 1,
    text: "Bu metinde (veya kitapta) asıl vurgulanmak istenen duygu/düşünce nedir?",
    options: ["Azim ve Kararlılık", "Hüzün ve Melankoli", "Teknolojik Gelişme", "Tarihsel Gerçekler"],
    correctIndex: 0
  },
  {
    id: 2,
    text: "Metindeki anlatım dili nasıldı?",
    options: ["Ağır ve Osmanlıca", "Akıcı ve Modern", "Karmaşık ve Teknik", "Şiirsel ve Soyut"],
    correctIndex: 1
  },
  {
    id: 3,
    text: "Okuduğun bölümden ne çıkardın?",
    options: ["Hiçbir şey", "Odaklanmam gerektiğini", "Hızlı okumanın faydasını", "Detayların önemini"],
    correctIndex: 3
  }
];

interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
}

export const generateQuizFromText = async (text: string): Promise<Question[]> => {
  // 1. Store'dan API Anahtarını al
  const apiKey = useNeuroStore.getState().apiKey;

  // Anahtar yoksa veya metin çok kısaysa Demo döndür
  if (!apiKey || text.length < 50) {
    console.warn("API Key eksik veya metin yetersiz, demo sorular kullanılıyor.");
    return FALLBACK_QUESTIONS;
  }

  try {
    // 2. Gemini'yi Başlat
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // 3. Yapay Zekaya Emir Ver (Prompt)
    // Maliyetten tasarruf için metnin sadece ilk 3000 karakterini gönderiyoruz.
    const prompt = `
      Aşağıdaki metni analiz et ve okuduğunu anlama üzerine 3 adet çoktan seçmeli soru hazırla.
      
      METİN: "${text.slice(0, 3000)}..."

      KURALLAR:
      1. Çıktı SADECE geçerli bir JSON formatında olsun. Markdown (backticks) kullanma.
      2. JSON şeması şöyle olmalı:
      [
        {
          "id": 1,
          "text": "Soru metni buraya",
          "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
          "correctIndex": 0 (Doğru şıkkın dizi indeksi: 0, 1, 2 veya 3)
        }
      ]
      3. Sorular metinle ilgili ve mantıklı olsun.
      4. Dil Türkçe olsun.
    `;

    // 4. Cevabı Al
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    // 5. JSON'u Temizle ve Parse Et
    // Bazen AI markdown kodu ekler (```json ... ```), onları siliyoruz.
    const cleanJson = textResponse.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(cleanJson);

    return questions;

  } catch (error) {
    console.error("Yapay Zeka Hatası:", error);
    return FALLBACK_QUESTIONS;
  }
};

// YENİ: Çeviri Fonksiyonu
export const translateText = async (text: string): Promise<string> => {
  const apiKey = useNeuroStore.getState().apiKey;

  if (!apiKey) {
    return "⚠️ Çeviri için Ayarlar sayfasından ücretsiz bir Gemini API Anahtarı girmelisiniz.";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      Aşağıdaki metni akıcı ve edebi bir Türkçeye çevir. Sadece çeviriyi ver, başka açıklama yapma.
      
      METİN: "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("Çeviri Hatası:", error);
    return "Çeviri servisine şu an ulaşılamıyor. Lütfen internet bağlantınızı ve API anahtarınızı kontrol edin.";
  }
};

// YENİ: Kelime Tanımlama Fonksiyonu
export const defineWord = async (word: string): Promise<{ definition: string; tr: string; example: string } | null> => {
  const apiKey = useNeuroStore.getState().apiKey;
  if (!apiKey) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      "${word}" kelimesini analiz et.
      Çıktıyı SADECE şu JSON formatında ver (Markdown kullanma):
      {
        "definition": "Kısa Türkçe veya İngilizce tanımı",
        "tr": "Türkçe karşılığı (tek kelime veya kısa ifade)",
        "example": "İçinde geçtiği kısa bir örnek cümle"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);

  } catch (error) {
    console.error("Sözlük Hatası:", error);
    return null;
  }
};

// YENİ: URL'den İçerik Çekme
export const extractContentFromUrl = async (url: string): Promise<{ title: string; content: string } | null> => {
  const apiKey = useNeuroStore.getState().apiKey;
  if (!apiKey) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      Şu web adresindeki ana makale içeriğini ve başlığını çıkar: ${url}
      
      Çıktıyı SADECE şu JSON formatında ver:
      {
        "title": "Makale Başlığı",
        "content": "Makalenin temizlenmiş, reklamsız tam metni..."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);

  } catch (error) {
    console.error("URL Okuma Hatası:", error);
    return null;
  }
};

// YENİ: Özet Çıkarma
export const summarizeBook = async (content: string): Promise<string> => {
  const apiKey = useNeuroStore.getState().apiKey;
  if (!apiKey) return "Özet için API anahtarı gerekli.";

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Maliyet tasarrufu için metnin başından 5000 karakter gönderelim
    const prompt = `
      Aşağıdaki metni analiz et ve en önemli 3 ana fikri madde madde, ilgi çekici bir dille Türkçe olarak özetle.
      Kısa ve vurucu olsun. Emoji kullan.
      
      METİN: "${content.slice(0, 5000)}..."
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("Özet Hatası:", error);
    return "Özet çıkarılamadı.";
  }
};
