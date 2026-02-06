import { analyzeWordWithGemini } from './gemini'; // Gemini servisini bağladık

export interface DictionaryDefinition {
  word: string
  phonetic?: string
  phonetics: Array<{ text?: string; audio?: string }>
  meanings: Array<{
    partOfSpeech: string
    definitions: Array<{
      definition: string
      example?: string
      synonyms?: string[]
      antonyms?: string[]
    }>
  }>
}

export async function fetchWordDefinition(word: string): Promise<DictionaryDefinition | null> {
  try {
    // 1. ADIM: Standart İngilizce Sözlüğü Dene
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    )

    if (response.ok) {
      const data = await response.json()
      return data[0] || null
    }

    // 2. ADIM: Eğer 404 aldıysak veya kelime Türkçeyse Gemini'den "Sözlük Formatında" veri iste
    console.log(`Sözlükte bulunamadı, Gemini devreye giriyor: ${word}`);
    return await fetchDefinitionFromAI(word);

  } catch (error) {
    console.error('Dictionary API error, falling back to AI:', error)
    return await fetchDefinitionFromAI(word);
  }
}

// Gemini'yi sözlük formatına uyduran yardımcı fonksiyon
async function fetchDefinitionFromAI(word: string): Promise<DictionaryDefinition | null> {
  try {
    // Gemini'den analiz iste
    // Not: analyzeWordWithGemini fonksiyonunu önceki adımlarda kurmuştuk
    const aiAnalysis = await analyzeWordWithGemini(word, "General Context");
    
    if (!aiAnalysis) return null;

    // AI'dan gelen metni sözlük objesine dönüştür (Basitleştirilmiş format)
    return {
      word: word,
      phonetics: [],
      meanings: [{
        partOfSpeech: 'AI Analysis',
        definitions: [{
          definition: aiAnalysis,
          example: 'AI generated definition.'
        }]
      }]
    };
  } catch (e) {
    return null;
  }
}

export function formatDefinition(data: DictionaryDefinition): string {
  if (!data.meanings || data.meanings.length === 0) return 'Tanım bulunamadı';
  const firstMeaning = data.meanings[0];
  const firstDefinition = firstMeaning.definitions?.[0];
  if (!firstDefinition) return 'Tanım bulunamadı';

  return `(${firstMeaning.partOfSpeech}) ${firstDefinition.definition}`;
}

export function getExampleSentence(data: DictionaryDefinition): string | null {
  for (const meaning of data.meanings) {
    for (const definition of meaning.definitions) {
      if (definition.example) return definition.example;
    }
  }
  return null;
}

export function getAudioUrl(data: DictionaryDefinition): string | null {
  for (const phonetic of data.phonetics) {
    if (phonetic.audio) return phonetic.audio;
  }
  return null;
}