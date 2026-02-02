import Tesseract from 'tesseract.js';

/**
 * Görselden metin tanıma (OCR). Türkçe dil desteği.
 * @param imagePathOrBuffer - Görsel yolu, data URL veya Buffer
 * @returns Tanınan metin; hata durumunda boş string
 */
export async function recognizeTextFromImage(
  imagePathOrBuffer: string | Buffer
): Promise<string> {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(imagePathOrBuffer, 'tur', {
      logger: (m) => console.log(m),
    });
    return text;
  } catch (error) {
    console.error('OCR Hatası:', error);
    return '';
  }
}
