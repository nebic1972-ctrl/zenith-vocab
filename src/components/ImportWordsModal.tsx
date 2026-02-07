'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { extractTextFromFile, extractWords, isSupportedFileType, formatFileSize } from '@/lib/textExtractor'
import { toast } from 'sonner'

interface ImportWordsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (words: string[]) => void
}

export default function ImportWordsModal({
  open,
  onOpenChange,
  onImport
}: ImportWordsModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [extractedWords, setExtractedWords] = useState<string[]>([])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!isSupportedFileType(selectedFile)) {
      toast.error('Desteklenmeyen dosya. PDF, EPUB, DOC, DOCX, TXT veya MD seçin.')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Dosya çok büyük. Maksimum 10MB.')
      return
    }

    setFile(selectedFile)
    setProcessing(true)

    try {
      const result = await extractTextFromFile(selectedFile)

      const words = extractWords(result.text, {
        minLength: 3,
        maxLength: 20,
        removeCommon: true,
        caseSensitive: false
      })

      setExtractedWords(words)

      toast.success(`${selectedFile.name} dosyasından ${words.length} benzersiz kelime çıkarıldı`, {
        description: `${result.wordCount} toplam kelime, ${result.source.toUpperCase()} format`
      })
    } catch (error) {
      console.error('File processing error:', error)
      toast.error(error instanceof Error ? error.message : 'Dosya işlenemedi')
      setFile(null)
    } finally {
      setProcessing(false)
    }
  }

  const handleImport = () => {
    if (extractedWords.length === 0) {
      toast.error('İçe aktarılacak kelime yok')
      return
    }

    onImport(extractedWords)
    onOpenChange(false)

    setFile(null)
    setExtractedWords([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dosyadan Kelime İçe Aktar</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
            <input
              type="file"
              id="file-upload"
              accept=".txt,.md,.pdf,.epub,.doc,.docx"
              onChange={handleFileSelect}
              disabled={processing}
              className="hidden"
            />

            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {processing ? (
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              ) : (
                <Upload className="h-12 w-12 text-gray-400" />
              )}

              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {processing ? 'İşleniyor...' : 'Dosya yüklemek için tıklayın'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  PDF, EPUB, DOC, DOCX, TXT veya MD (maks 10MB)
                </p>
              </div>
            </label>
          </div>

          {file && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
          )}

          {extractedWords.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Çıkarılan Kelimeler ({extractedWords.length})
              </h3>
              <div className="max-h-40 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {extractedWords.slice(0, 50).map((word, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white dark:bg-gray-700 rounded text-sm"
                    >
                      {word}
                    </span>
                  ))}
                  {extractedWords.length > 50 && (
                    <span className="px-2 py-1 text-sm text-gray-500">
                      +{extractedWords.length - 50} daha...
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={processing}
            >
              İptal
            </Button>
            <Button
              onClick={handleImport}
              disabled={processing || extractedWords.length === 0}
            >
              İçe Aktar {extractedWords.length > 0 && `(${extractedWords.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
