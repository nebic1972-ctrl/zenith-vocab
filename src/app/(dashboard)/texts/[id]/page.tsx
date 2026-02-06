'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, BookMarked, Loader2, CheckCircle2, Brain } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { GeminiAnalysis } from '@/lib/services/gemini'

interface LibraryText {
  id: string
  title: string
  content_text: string
  file_type: string
  created_at: string
}

interface SelectedWord {
  word: string
  sentence: string
}

export default function TextDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [text, setText] = useState<LibraryText | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWords, setSelectedWords] = useState<SelectedWord[]>([])
  const [saving, setSaving] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, GeminiAnalysis | null>>({})
  const [analyzingWord, setAnalyzingWord] = useState<string | null>(null)

  const textId = typeof params.id === 'string' ? params.id : params.id?.[0]

  const loadText = useCallback(async () => {
    if (!textId) return
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('library')
        .select('*')
        .eq('id', textId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      setText(data as LibraryText)
    } catch (error) {
      console.error('Metin yüklenemedi:', error)
      router.push('/texts')
    } finally {
      setLoading(false)
    }
  }, [textId, router])

  useEffect(() => {
    if (textId) loadText()
  }, [textId, loadText])

  const handleWordClick = (word: string, sentence: string) => {
    // Kelimeyi temizle (noktalama işaretlerini kaldır)
    const cleanWord = word.replace(/[.,!?;:()"""'']/g, '').toLowerCase()

    if (!cleanWord) return

    const alreadySelected = selectedWords.some(w => w.word === cleanWord)

    if (alreadySelected) {
      // Seçimi kaldır
      const newWords = selectedWords.filter(w => w.word !== cleanWord)
      setSelectedWords(newWords)
      setAiAnalysis(prev => {
        const next = { ...prev }
        delete next[cleanWord]
        return next
      })
    } else {
      setSelectedWords([...selectedWords, { word: cleanWord, sentence }])
    }
  }

  const analyzeWordWithAI = (word: string, sentence: string) => {
    setAnalyzingWord(word)
    fetch('/api/ai/analyze-word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, contextSentence: sentence }),
    })
      .then(res => res.ok ? res.json() : null)
      .then(analysis => {
        setAiAnalysis(prev => ({ ...prev, [word]: analysis }))
      })
      .catch(() => setAiAnalysis(prev => ({ ...prev, [word]: null })))
      .finally(() => setAnalyzingWord(null))
  }

  const saveWords = async () => {
    if (selectedWords.length === 0) {
      toast.error('Lütfen en az bir kelime seçin')
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Kullanıcı bulunamadı')

      const vocabularyRecords = selectedWords.map(({ word, sentence }) => {
        const def = aiAnalysis[word]?.translation || 'Bağlamdan eklenen kelime'
        return {
          user_id: user.id,
          word,
          definition: def.trim() || 'Bağlamdan eklenen kelime',
          example_sentence: sentence || null,
          book_id: textId || null,
          status: 'yeni',
        }
      })

      const { error } = await supabase
        .from('vocabulary')
        .insert(vocabularyRecords)

      if (error) throw error

      toast.success(`${selectedWords.length} kelime başarıyla kaydedildi!`)
      router.push('/vocabulary')
    } catch (error: unknown) {
      console.error('Kelimeler kaydedilemedi:', error)
      toast.error(error instanceof Error ? error.message : 'Kelimeler kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  const renderTextWithSelection = () => {
    if (!text?.content_text) return null

    const content = text.content_text
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content]

    return sentences.map((sentence, sentenceIndex) => {
      const words = sentence.split(/(\s+)/)

      return (
        <span key={sentenceIndex} className="inline">
          {words.map((word, wordIndex) => {
            if (word.match(/^\s+$/)) {
              return <span key={wordIndex}>{word}</span>
            }

            const cleanWord = word.replace(/[.,!?;:()"""'']/g, '').toLowerCase()
            const isSelected = selectedWords.some(w => w.word === cleanWord)

            return (
              <span
                key={wordIndex}
                onClick={() => handleWordClick(word, sentence.trim())}
                className={`cursor-pointer hover:bg-blue-100 rounded px-0.5 transition-colors ${
                  isSelected ? 'bg-blue-200 font-semibold text-blue-900' : ''
                }`}
              >
                {word}
              </span>
            )
          })}
        </span>
      )
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!text) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-600">Metin bulunamadı</p>
            <Link href="/texts">
              <Button className="mt-4">Metinlere Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/texts">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{text.title}</h1>
            <p className="text-slate-600 mt-1">
              {new Date(text.created_at).toLocaleDateString('tr-TR')}
            </p>
          </div>
          <Badge variant="secondary">{selectedWords.length} kelime seçildi</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Text Content */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Metin</CardTitle>
            <CardDescription>
              Öğrenmek istediğiniz kelimelere tıklayın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate max-w-none">
              <p className="text-base leading-relaxed text-slate-700 select-none">
                {renderTextWithSelection()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Selected Words Sidebar */}
        <Card className="lg:col-span-1 h-fit sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookMarked className="h-5 w-5" />
              Seçilen Kelimeler
            </CardTitle>
            <CardDescription>
              {selectedWords.length === 0
                ? 'Henüz kelime seçmediniz'
                : `${selectedWords.length} kelime seçildi`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {selectedWords.length === 0 ? (
              <div className="text-center py-8">
                <BookMarked className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  Metinden kelime seçmek için kelimelere tıklayın
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Kelime Listesi */}
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {selectedWords.map(({ word, sentence }, index) => {
                    const analysis = aiAnalysis[word]
                    const isAnalyzing = analyzingWord === word

                    const difficultyLabels: Record<string, string> = {
                      beginner: 'Başlangıç',
                      intermediate: 'Orta',
                      advanced: 'İleri',
                    }

                    return (
                      <div
                        key={`${word}-${index}`}
                        className="group rounded-lg border border-blue-200 overflow-hidden"
                      >
                        {/* Kelime başlığı */}
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-slate-50">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <span className="text-sm font-semibold text-slate-900">
                              {word}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {!analysis && !isAnalyzing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => analyzeWordWithAI(word, sentence)}
                                className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Brain className="h-3 w-3 mr-1" />
                                AI Analiz
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedWords(selectedWords.filter((_, i) => i !== index))
                                setAiAnalysis(prev => {
                                  const next = { ...prev }
                                  delete next[word]
                                  return next
                                })
                              }}
                              className="opacity-0 group-hover:opacity-100 h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 transition-opacity"
                            >
                              Kaldır
                            </Button>
                          </div>
                        </div>

                        {/* AI Analizi */}
                        {isAnalyzing && (
                          <div className="p-3 bg-slate-50 border-t border-blue-100">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>AI analiz ediliyor...</span>
                            </div>
                          </div>
                        )}

                        {analysis && (
                          <div className="p-3 bg-slate-50 border-t border-blue-100 space-y-2">
                            <div>
                              <p className="text-xs text-slate-500 font-medium">Türkçe:</p>
                              <p className="text-sm text-slate-900">{analysis.translation}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-medium">Bağlam:</p>
                              <p className="text-xs text-slate-700">{analysis.contextAnalysis}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {difficultyLabels[analysis.difficulty] || analysis.difficulty}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Kaydet Butonu */}
                <div className="pt-2 border-t">
                  <Button
                    onClick={saveWords}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        {selectedWords.length} Kelimeyi Kaydet
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
