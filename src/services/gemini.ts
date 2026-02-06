/**
 * Google Gemini API Service
 * MOCK MODE: Returns hardcoded quiz questions to avoid API errors
 * TODO: Re-enable real API when Google API issues are resolved
 */

// import { GoogleGenerativeAI } from "@google/generative-ai";

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number; // 0-based index of correct answer
}

/**
 * Generate quiz questions from text (MOCK MODE)
 * Simulates network delay and returns hardcoded questions
 * @param text - The text to analyze (not used in mock mode)
 * @param apiKey - Google Gemini API key (not used in mock mode)
 * @returns Array of quiz questions
 */
export async function generateQuizFromText(
  text: string,
  apiKey: string
): Promise<QuizQuestion[]> {
  // Simulate network delay (2 seconds)
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Return mock questions
  const mockQuestions: QuizQuestion[] = [
    {
      question: "Bu metnin ana teması nedir? (AI Simülasyonu)",
      options: ["Hızlı Okuma", "Odaklanma", "Beyin Egzersizi", "Hepsi"],
      answerIndex: 3 // "Hepsi"
    },
    {
      question: "Yazarın vurguladığı en önemli yetenek hangisidir?",
      options: ["Hafıza", "Hız", "Anlama", "Göz Kasları"],
      answerIndex: 2 // "Anlama"
    },
    {
      question: "Bu platformun temel amacı nedir?",
      options: ["Eğlence", "Bilişsel Gelişim", "Hız Rekabeti", "Kitap Okuma"],
      answerIndex: 1 // "Bilişsel Gelişim"
    }
  ];

  console.log('✅ [GEMINI] Mock mode: Returning hardcoded quiz questions');
  return mockQuestions;

  /* REAL API CODE (COMMENTED OUT)
  if (!apiKey || !apiKey.trim()) {
    throw new Error("API Anahtarı eksik.");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `Aşağıdaki metni analiz et ve Türkçe dilinde 3 adet çoktan seçmeli soru oluştur...
    Metin: ${text.slice(0, 8000)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    let cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonArrayMatch = cleanJson.match(/\[[\s\S]*\]/);
    if (jsonArrayMatch) {
      cleanJson = jsonArrayMatch[0];
    }

    const questions: QuizQuestion[] = JSON.parse(cleanJson);
    // Validation...
    return questions;
  } catch (error: any) {
    console.error("🔴 [GEMINI] SDK Error:", error);
    throw new Error(error.message || "Yapay zeka bağlanamadı.");
  }
  */
}
