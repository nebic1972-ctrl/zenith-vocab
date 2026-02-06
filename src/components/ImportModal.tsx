'use client'

import { useState, useRef } from 'react'
import { X, Upload, FileText, File, Table, AlertCircle, CheckCircle, Download, Sparkles } from 'lucide-react'
import { WordData } from './AddWordModal'
import BatchCategorization from './BatchCategorization'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (words: WordData[]) => void
}

export default function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [preview, setPreview] = useState<WordData[]>([])
  const [error, setError] = useState<string>('')
  const [showBatchCategorize, setShowBatchCategorize] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supportedFormats = [
    { ext: '.txt', icon: FileText, name: 'Text', desc: 'Satır satır' },
    { ext: '.csv', icon: Table, name: 'CSV', desc: 'Excel uyumlu' },
    { ext: '.json', icon: File, name: 'JSON', desc: 'Yapılandırılmış' },
  ]

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = async (file: File) => {
    setError('')
    setIsProcessing(true)
    setPreview([])

    try {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      let words: WordData[] = []

      switch (ext) {
        case '.txt':
          words = await parseTxt(file)
          break
        case '.csv':
          words = await parseCsv(file)
          break
        case '.json':
          words = await parseJson(file)
          break
        default:
          throw new Error(`Desteklenmeyen dosya formatı: ${ext}. Lütfen TXT, CSV veya JSON kullanın.`)
      }

      if (words.length === 0) {
        throw new Error('Dosyada geçerli kelime bulunamadı. Format örneğini kontrol edin.')
      }

      setPreview(words)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dosya işlenirken hata oluştu')
    } finally {
      setIsProcessing(false)
    }
  }

  // TXT Parser - Her satır: kelime, çeviri, fonetik, örnek, kategori, seviye
  const parseTxt = async (file: File): Promise<WordData[]> => {
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    const results: WordData[] = []

    lines.forEach((line, index) => {
      const parts = line.split(/[,;\t]/).map(p => p.trim())

      if (parts.length < 2) {
        console.warn(`Satır ${index + 1} atlandı: En az kelime ve çeviri gerekli`)
        return
      }

      const [word, translation, phonetic, example, category, level] = parts
      if (!word || !translation) {
        console.warn(`Satır ${index + 1} atlandı: Kelime veya çeviri eksik`)
        return
      }

      results.push({
        word,
        translation,
        phonetic: phonetic || undefined,
        example: example || undefined,
        category: category || 'Genel',
        level: level || 'B1'
      })
    })

    return results
  }

  // CSV Parser
  const parseCsv = async (file: File): Promise<WordData[]> => {
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())

    if (lines.length < 2) {
      throw new Error('CSV dosyası en az 2 satır içermelidir (başlık + veri)')
    }

    // İlk satırı başlık olarak al
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

    const results: WordData[] = []

    lines.slice(1).forEach((line, index) => {
      const values = line.split(',').map(v => v.trim())
      const record: Record<string, string> = {}

      headers.forEach((header, i) => {
        record[header] = values[i] ?? ''
      })

      const word = record.word || record.kelime || record.english || record.en || ''
      const translation = record.translation || record.turkce || record.turkish || record.tr || record.çeviri || ''

      if (!word || !translation) {
        console.warn(`Satır ${index + 2} atlandı: Kelime veya çeviri eksik`)
        return
      }

      results.push({
        word,
        translation,
        phonetic: record.phonetic || record.fonetik || undefined,
        example: record.example || record.ornek || record.örnek || record.sentence || undefined,
        category: record.category || record.kategori || 'Genel',
        level: record.level || record.seviye || 'B1'
      })
    })

    return results
  }

  // JSON Parser
  const parseJson = async (file: File): Promise<WordData[]> => {
    const text = await file.text()
    const data = JSON.parse(text)

    if (!Array.isArray(data)) {
      throw new Error('JSON formatı hatalı. Array bekleniyor: [{word:"...", translation:"..."}]')
    }

    const results: WordData[] = []

    data.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        console.warn(`Öğe ${index + 1} atlandı: Beklenmeyen veri tipi`)
        return
      }

      const word = item.word || item.english || item.en || ''
      const translation = item.translation || item.turkish || item.turkce || item.tr || ''

      if (!word || !translation) {
        console.warn(`Öğe ${index + 1} atlandı: Kelime veya çeviri eksik`)
        return
      }

      results.push({
        word,
        translation,
        phonetic: item.phonetic || undefined,
        example: item.example || undefined,
        category: item.category || 'Genel',
        level: item.level || 'B1'
      })
    })

    return results
  }

  const handleImport = () => {
    onImport(preview)
    setPreview([])
    setError('')
    setShowBatchCategorize(false)
    onClose()
  }

  const categoryMap: Record<string, string> = {
    daily: 'Günlük Konuşma',
    business: 'İş İngilizcesi',
    academic: 'Akademik',
    technical: 'Teknik',
    travel: 'Seyahat',
    legal: 'Hukuk',
    medical: 'Tıp',
    food: 'Yemek',
    sports: 'Spor',
    entertainment: 'Eğlence',
    science: 'Bilim',
    art: 'Sanat',
    politics: 'Politika',
    finance: 'Finans',
    education: 'Eğitim',
    technology: 'Teknoloji',
  }

  const handleBatchComplete = (results: Array<{ word: string; category: string; level: string }>) => {
    const resultMap = new Map(results.map((r) => [r.word, r]))
    setPreview(
      preview.map((w) => {
        const r = resultMap.get(w.word)
        if (!r) return w
        return {
          ...w,
          category: categoryMap[r.category] || r.category,
          level: r.level,
        }
      })
    )
    setShowBatchCategorize(false)
  }

  const downloadExample = (format: 'txt' | 'csv' | 'json') => {
    let content = ''
    let filename = ''
    
    if (format === 'txt') {
      content = `however, ancak, /haʊˈevər/, I wanted to go; however I was tired., Akademik, C1
therefore, bu nedenle, /ˈðerfɔːr/, He was ill therefore absent., Akademik, B2
although, her ne kadar, /ɔːlˈðoʊ/, Although it was raining we went out., Günlük Konuşma, B1`
      filename = 'ornek-kelimeler.txt'
    } else if (format === 'csv') {
      content = `word,translation,phonetic,example,category,level
however,ancak,/haʊˈevər/,I wanted to go; however I was tired.,Akademik,C1
therefore,bu nedenle,/ˈðerfɔːr/,He was ill therefore absent.,Akademik,B2
although,her ne kadar,/ɔːlˈðoʊ/,Although it was raining we went out.,Günlük Konuşma,B1`
      filename = 'ornek-kelimeler.csv'
    } else {
      content = JSON.stringify([
        {
          word: "however",
          translation: "ancak",
          phonetic: "/haʊˈevər/",
          example: "I wanted to go; however, I was tired.",
          category: "Akademik",
          level: "C1"
        },
        {
          word: "therefore",
          translation: "bu nedenle",
          phonetic: "/ˈðerfɔːr/",
          example: "He was ill and therefore absent.",
          category: "Akademik",
          level: "B2"
        }
      ], null, 2)
      filename = 'ornek-kelimeler.json'
    }
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Başlık */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Upload size={24} />
            Kelime İçe Aktar
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          
          {/* Desteklenen Formatlar */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Desteklenen Formatlar:</h3>
            <div className="grid grid-cols-3 gap-3">
              {supportedFormats.map((format) => {
                const Icon = format.icon
                return (
                  <div key={format.ext} className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4 text-center hover:border-green-300 transition-colors">
                    <Icon size={32} className="mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-bold text-slate-800">{format.name}</p>
                    <p className="text-xs text-slate-500 mb-2">{format.desc}</p>
                    <button
                      onClick={() => downloadExample(format.ext.slice(1) as any)}
                      className="text-xs text-green-600 hover:text-green-700 font-semibold flex items-center gap-1 mx-auto"
                    >
                      <Download size={12} />
                      Örnek İndir
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-3 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-green-500 bg-green-50'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <Upload size={48} className={`mx-auto mb-4 ${isDragging ? 'text-green-600' : 'text-slate-400'}`} />
            <p className="text-lg font-semibold text-slate-800 mb-2">
              Dosyayı buraya sürükleyin veya tıklayın
            </p>
            <p className="text-sm text-slate-600">
              TXT, CSV veya JSON formatında
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Format Örnekleri */}
          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
              <AlertCircle size={16} />
              Format Örnekleri:
            </h4>
            <div className="space-y-3 text-xs">
              <div className="bg-white p-3 rounded border border-blue-200">
                <strong className="text-blue-900">TXT Format:</strong>
                <pre className="mt-1 text-slate-700 font-mono">kelime, çeviri, fonetik, örnek, kategori, seviye</pre>
                <pre className="mt-1 text-slate-600 font-mono text-xs">however, ancak, /haʊˈevər/, I wanted to go..., Akademik, C1</pre>
              </div>
              <div className="bg-white p-3 rounded border border-blue-200">
                <strong className="text-blue-900">CSV Format:</strong>
                <pre className="mt-1 text-slate-700 font-mono">word,translation,phonetic,example,category,level</pre>
                <pre className="mt-1 text-slate-600 font-mono text-xs">however,ancak,/haʊˈevər/,I wanted to go...,Akademik,C1</pre>
              </div>
              <div className="bg-white p-3 rounded border border-blue-200">
                <strong className="text-blue-900">JSON Format:</strong>
                <pre className="mt-1 text-slate-700 font-mono">[{"{"}word:"...", translation:"...", ...{"}"}]</pre>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900">Hata Oluştu</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Processing */}
          {isProcessing && (
            <div className="mt-4 text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Dosya işleniyor...</p>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div className="mt-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4 flex items-center gap-3">
                <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                <p className="text-sm font-bold text-green-900">
                  ✅ {preview.length} kelime başarıyla okundu ve sözlüğe eklenmeye hazır!
                </p>
              </div>

              {showBatchCategorize ? (
                <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 mb-4">
                  <BatchCategorization
                    words={preview.map((w) => ({ word: w.word, translation: w.translation }))}
                    onComplete={handleBatchComplete}
                    onCancel={() => setShowBatchCategorize(false)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowBatchCategorize(true)}
                  className="mb-4 w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold transition-colors"
                >
                  <Sparkles size={20} />
                  ✨ Gemini 2.5 ile Toplu Kategorilendir
                </button>
              )}

              <div className="max-h-80 overflow-y-auto border-2 border-slate-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-800">#</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-800">Kelime</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-800">Çeviri</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-800">Kategori</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-800">Seviye</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((word, i) => (
                      <tr key={i} className="border-t border-slate-200 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600">{i + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{word.word}</td>
                        <td className="px-4 py-3 text-slate-700">{word.translation}</td>
                        <td className="px-4 py-3 text-slate-600">{word.category}</td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                            {word.level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setPreview([])
                    setError('')
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
                >
                  ✅ {preview.length} Kelimeyi Sözlüğe Ekle
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
