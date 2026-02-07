import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGoogleApiKey } from "@/lib/config";
import { requireAuth } from "@/lib/apiAuth";

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const body = await req.json();
    const { text } = body;

    const apiKey = getGoogleApiKey();
    if (!apiKey) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY tanımlı değil (.env.local)");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Metni kırp (Hız ve limit için)
    const truncatedText = text.length > 3000 ? text.substring(0, 3000) : text;

    const prompt = `
      Aşağıdaki metni analiz et ve 3 adet çoktan seçmeli soru oluştur.
      Çıktı SADECE saf JSON olsun. Markdown bloğu kullanma.
      
      JSON Formatı:
      [
        {
          "question": "Soru?",
          "options": ["A", "B", "C", "D"],
          "answer": 0
        }
      ]

      Metin:
      "${truncatedText}"
    `;
    
    // AI'ya sor
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text();

    // Temizlik
    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return NextResponse.json(JSON.parse(textResponse));

  } catch (error: any) {
    console.error("API Error:", error);
    
    // Hata olursa yine YEDEK soruları döndür (Sistem çökmesin)
    return NextResponse.json([
      {
        question: "Metni dikkatlice okudunuz mu? (Yapay Zeka Bağlantısı Bekleniyor...)",
        options: ["Evet, okudum", "Hayır, atladım", "Tekrar okuyacağım", "Emin değilim"],
        answer: 0
      }
    ]);
  }
}
