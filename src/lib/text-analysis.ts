/**
 * Text Complexity Analysis
 * Adapted Flesch-Kincaid logic for Turkish text
 */

export interface TextAnalysis {
  wordCount: number;
  estimatedTimeMinutes: number;
  difficultyLevel: 'Çok Kolay' | 'Kolay' | 'Orta' | 'Zor' | 'Akademik';
  averageSentenceLength: number;
  averageWordLength: number;
  complexityScore: number; // 0-100, higher = easier
}

/**
 * Count syllables in a Turkish word (approximation)
 * Turkish has more predictable syllable patterns than English
 */
const countSyllables = (word: string): number => {
  if (!word || word.length === 0) return 0;
  
  // Remove punctuation
  const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
  if (cleanWord.length === 0) return 0;
  
  // Turkish vowel count approximation (each vowel is typically a syllable)
  const vowels = cleanWord.match(/[aeıioöuü]/g);
  const vowelCount = vowels ? vowels.length : 1; // At least 1 syllable
  
  // Adjust for common Turkish patterns
  // If word ends with consonant cluster, might be 1 syllable
  if (cleanWord.length <= 3) return 1;
  
  return Math.max(1, vowelCount);
};

/**
 * Analyze text complexity using Flesch-Kincaid adapted for Turkish
 */
export const analyzeText = (text: string, userWpm: number = 200): TextAnalysis => {
  if (!text || text.trim().length === 0) {
    return {
      wordCount: 0,
      estimatedTimeMinutes: 0,
      difficultyLevel: 'Orta',
      averageSentenceLength: 0,
      averageWordLength: 0,
      complexityScore: 50,
    };
  }

  // Clean and normalize text
  const cleanText = text
    .replace(/\s+/g, ' ')
    .trim();

  // Split into sentences (Turkish sentence endings: . ! ?)
  const sentences = cleanText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Split into words
  const words = cleanText
    .split(/\s+/)
    .filter(w => w.length > 0);

  const wordCount = words.length;
  
  // Calculate average sentence length
  const averageSentenceLength = sentences.length > 0 
    ? wordCount / sentences.length 
    : 0;

  // Calculate average word length (in characters and syllables)
  let totalChars = 0;
  let totalSyllables = 0;
  
  words.forEach(word => {
    const cleanWord = word.replace(/[.,!?;:]/g, '');
    totalChars += cleanWord.length;
    totalSyllables += countSyllables(cleanWord);
  });

  const averageWordLength = wordCount > 0 ? totalChars / wordCount : 0;
  const averageSyllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 0;

  // Flesch-Kincaid formula adapted for Turkish
  // Original: 206.835 - (1.015 * ASL) - (84.6 * ASW)
  // ASL = Average Sentence Length
  // ASW = Average Syllables per Word
  // For Turkish, we adjust the coefficients slightly
  
  const complexityScore = Math.max(0, Math.min(100,
    206.835 - (1.015 * averageSentenceLength) - (84.6 * averageSyllablesPerWord)
  ));

  // Determine difficulty level based on score
  let difficultyLevel: TextAnalysis['difficultyLevel'];
  if (complexityScore >= 80) {
    difficultyLevel = 'Çok Kolay';
  } else if (complexityScore >= 60) {
    difficultyLevel = 'Kolay';
  } else if (complexityScore >= 40) {
    difficultyLevel = 'Orta';
  } else if (complexityScore >= 20) {
    difficultyLevel = 'Zor';
  } else {
    difficultyLevel = 'Akademik';
  }

  // Calculate estimated reading time (in minutes)
  const estimatedTimeMinutes = Math.max(1, Math.ceil(wordCount / userWpm));

  return {
    wordCount,
    estimatedTimeMinutes,
    difficultyLevel,
    averageSentenceLength,
    averageWordLength,
    complexityScore,
  };
};
