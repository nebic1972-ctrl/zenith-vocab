import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getGoogleApiKey } from '@/lib/config'

const GEMINI_MODEL = 'gemini-2.5-flash'
const apiKey = getGoogleApiKey()
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

export async function POST(request: Request) {
  try {
    if (!genAI) {
      return NextResponse.json(
        { error: 'API Key yapılandırılmamış. .env.local dosyasını kontrol edin.' },
        { status: 500 }
      )
    }
    // 1. Veriyi Al
    const body = await request.json()
    const { word, context } = body

    if (!word) {
      return NextResponse.json({ error: 'Kelime eksik.' }, { status: 400 })
    }

    // 2. Modeli Başlat
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

    // 3. Prompt Hazırla (JSON formatında yanıt zorluyoruz)
    const prompt = `
      Sen profesyonel bir dil koçusun.
      Kelime: "${word}"
      Bağlam Cümlesi: "${context || 'Yok'}"
      
      Görevin: Bu kelimeyi analiz et ve Türkçe yanıt ver.
      
      Lütfen yanıtı SADECE şu JSON formatında ver (Markdown veya ek açıklama kullanma):
      {
        "translation": "Kelimenin en uygun Türkçe karşılığı",
        "contextAnalysis": "Kelimenin bu cümledeki kullanım amacı ve nüansı (kısa ve net)",
        "difficulty": "Seviye (A1, A2, B1, B2, C1 veya C2)"
      }
    `

    console.log(`🤖 Sözlük Analizi İsteniyor: ${word}`)

    // 4. AI'dan Yanıt Al
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // 5. JSON Temizliği (AI bazen ```json ... ``` ekler, onları siliyoruz)
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()
    
    let analysis;
    try {
      analysis = JSON.parse(cleanedText)
    } catch (e) {
      console.error("JSON Parse Hatası:", text)
      // Yedek yanıt döndür ki kutu boş kalmasın
      analysis = {
        translation: "Çeviri alınamadı",
        contextAnalysis: text.substring(0, 100) + "...", // Ham metni göster
        difficulty: "-"
      }
    }

    console.log('✅ Analiz Başarılı:', analysis)

    return NextResponse.json(analysis)

  } catch (error: any) {
    console.error('🔥 API Hatası:', error)
    return NextResponse.json(
      { error: error.message || 'Sunucu hatası.' },
      { status: 500 }
    )
  }
}
