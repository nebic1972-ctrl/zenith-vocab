import { NextResponse } from 'next/server'
import { generateFlashcardHint } from '@/lib/services/gemini'
import { requireAuth } from '@/lib/apiAuth'

export async function POST(request: Request) {
  try {
    const auth = await requireAuth()
    if (auth.response) return auth.response

    // 1. Gelen veriyi alalım
    const body = await request.json()
    const { word, definition } = body

    // Basit doğrulama
    if (!word || !definition) {
      return NextResponse.json(
        { error: 'Kelime veya tanım eksik.' },
        { status: 400 }
      )
    }

    // 2. Yapay Zekayı çağıralım
    console.log(`🤖 AI Çalışıyor: "${word}" için istek gönderiliyor...`)
    
    const hint = await generateFlashcardHint(word, definition)
    
    console.log('✅ AI Başarılı, İpucu:', hint)

    return NextResponse.json({ hint })

  } catch (error: any) {
    // Hata detayını konsola yazdır
    console.error('🔥 API HATASI (Detaylı):', error)
    
    return NextResponse.json(
      { error: error.message || 'Sunucu hatası oluştu.' },
      { status: 500 }
    )
  }
}
