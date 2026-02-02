import * as pdfjsLib from 'pdfjs-dist';
import { recognizeTextFromImage } from './ocrEngine';

/** Boş sayfa → Canvas’a çiz → OCR ile metin çıkar. */
async function extractTextViaOCR(page: pdfjsLib.PDFPageProxy): Promise<string> {
  if (typeof document === 'undefined') return '';
  const scale = 2;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const renderTask = page.render({
    canvasContext: ctx,
    viewport,
  });
  await renderTask.promise;
  const dataUrl = canvas.toDataURL('image/png');
  return recognizeTextFromImage(dataUrl);
}

export const extractTextFromPDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    let pageText = textContent.items
      .map((item: { str?: string }) => item.str ?? '')
      .join(' ')
      .trim();

    if (!pageText) {
      pageText = await extractTextViaOCR(page);
    }
    fullText += pageText + ' ';

    if (i % 20 === 0) await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  return fullText.replace(/\s+/g, ' ').trim();
};
