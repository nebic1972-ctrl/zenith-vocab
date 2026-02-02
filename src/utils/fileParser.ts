import * as pdfjsLib from 'pdfjs-dist';

// Worker ayarı: Bu, PDF'in arka planda işlenmesini sağlar.
// CDN kullanarak Next.js build hatalarını önlüyoruz.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const extractTextFromFile = async (file: File): Promise<string> => {
  const fileType = file.type;

  // 1. PDF İŞLEYİCİ
  if (fileType === 'application/pdf') {
    return await readPdf(file);
  }
  
  // 2. TEXT/PLAIN İŞLEYİCİ (.txt)
  if (fileType === 'text/plain') {
    return await readText(file);
  }

  // 3. EPUB (Şimdilik basit bir uyarı, epub.js çok ağırdır, sonra ekleriz)
  if (fileType.includes('epub')) {
    throw new Error("EPUB desteği bir sonraki güncellemede gelecek Kaptan! Şimdilik PDF veya TXT kullan.");
  }

  throw new Error("Desteklenmeyen dosya formatı. Lütfen PDF veya TXT yükleyin.");
};

// --- PDF OKUMA MANTIĞI ---
const readPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  // Tüm sayfaları gez
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Sayfadaki metin parçalarını birleştir
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    
    fullText += pageText + '\n\n';
  }

  return cleanText(fullText);
};

// --- TXT OKUMA MANTIĞI ---
const readText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(cleanText(e.target?.result as string));
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

// --- METİN TEMİZLEME ---
// PDF'ten gelen bozuk boşlukları ve gereksiz karakterleri temizler
const cleanText = (text: string): string => {
  return text
    .replace(/\s+/g, ' ') // Çoklu boşlukları teke indir
    .trim();
};
