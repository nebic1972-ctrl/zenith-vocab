import * as pdfjsLib from 'pdfjs-dist';

// DEĞİŞEN KISIM BURASI (Artık yerel dosyayı kullanıyoruz)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export const extractTextFromPDF = async (url: string): Promise<string[]> => {
  try {
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    
    let fullText = "";

    // Tüm sayfaları gez
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        // @ts-ignore
        .map((item) => item.str)
        .join(" ");
        
      fullText += pageText + " ";
    }

    // Temizle ve kelimelere böl
    return fullText
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ');

  } catch (error) {
    console.error("PDF Okuma Hatası:", error);
    throw new Error("PDF dosyası okunamadı.");
  }
};
