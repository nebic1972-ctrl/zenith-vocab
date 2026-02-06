import { NextRequest, NextResponse } from 'next/server';
import { generateFlashcard } from '@/core/google/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { word, context } = body;

    console.log('📝 Flashcard API çağrısı alındı:', { word });

    if (!word || typeof word !== 'string') {
      return NextResponse.json(
        { error: 'Kelime gerekli' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error('❌ GOOGLE_GENERATIVE_AI_API_KEY tanımlanmamış!');
      return NextResponse.json(
        { error: 'API Key tanımlanmamış' },
        { status: 500 }
      );
    }

    console.log('🔍 Google Gemini API çağrısı başladı:', { word });

    const result = await generateFlashcard(
      word.trim(),
      typeof context === 'string' ? context.trim() : ''
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      flashcard: result.data,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('❌ Flashcard API hatası:', error);
    return NextResponse.json(
      {
        error: 'Flashcard oluşturulamadı',
        details: err?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}
