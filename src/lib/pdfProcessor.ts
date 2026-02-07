'use client'

import * as pdfjsLib from 'pdfjs-dist'

// PDF.js worker'ı CDN'den yükle (v5+ .mjs format)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

export interface PDFProcessResult {
  text: string
  pageCount: number
  metadata?: {
    title?: string
    author?: string
    subject?: string
  }
}

/**
 * PDF dosyasından metin çıkar
 * @param file PDF dosyası (File veya Blob)
 * @returns Çıkarılan metin ve metadata
 */
export async function extractTextFromPDF(file: File | Blob): Promise<PDFProcessResult> {
  try {
    const arrayBuffer = await file.arrayBuffer()

    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      isEvalSupported: false
    })

    const pdf = await loadingTask.promise

    const metadata = await pdf.getMetadata().catch(() => ({ info: {} }))

    const pageTexts: string[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()

      const pageText = textContent.items
        .map((item: { str?: string }) => item.str ?? '')
        .join(' ')

      pageTexts.push(pageText)
    }

    const fullText = pageTexts.join('\n\n')

    return {
      text: fullText,
      pageCount: pdf.numPages,
      metadata: {
        title: metadata.info?.Title,
        author: metadata.info?.Author,
        subject: metadata.info?.Subject
      }
    }
  } catch (error) {
    console.error('PDF processing error:', error)
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * PDF'den kelimeleri çıkar (vocabulary için)
 */
export async function extractWordsFromPDF(
  file: File | Blob,
  minWordLength: number = 3
): Promise<string[]> {
  const result = await extractTextFromPDF(file)

  const words = result.text
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.replace(/[^a-z'-]/g, ''))
    .filter(word => word.length >= minWordLength)

  return Array.from(new Set(words)).sort()
}

/**
 * PDF'in ilk sayfasını önizleme olarak render et
 */
export async function renderPDFPreview(
  file: File | Blob,
  canvas: HTMLCanvasElement,
  scale: number = 1.5
): Promise<void> {
  try {
    const arrayBuffer = await file.arrayBuffer()

    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      isEvalSupported: false
    })

    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)

    const viewport = page.getViewport({ scale })
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Canvas context not available')
    }

    canvas.height = viewport.height
    canvas.width = viewport.width

    await page.render({
      canvasContext: context,
      viewport
    }).promise
  } catch (error) {
    console.error('PDF preview error:', error)
    throw new Error(`Failed to render PDF preview: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
