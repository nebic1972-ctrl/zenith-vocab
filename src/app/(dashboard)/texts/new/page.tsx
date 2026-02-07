'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Upload, FileText } from 'lucide-react'
import Link from 'next/link'
import { extractTextFromFile, isSupportedFileType } from '@/lib/textExtractor'

export default function NewTextPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim() || !content.trim()) {
      setError('Başlık ve içerik gereklidir')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Kullanıcı bulunamadı')

      const { data, error: insertError } = await supabase
        .from('library')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content_text: content.trim(),
          file_type: 'txt',
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      router.push(`/texts/${data.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Metin kaydedilemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isSupportedFileType(file)) {
      setError('Desteklenmeyen dosya. PDF, EPUB, DOC, DOCX, TXT veya MD yükleyin.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Dosya çok büyük. Maksimum 10MB.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await extractTextFromFile(file)
      setContent(result.text)
      if (!title) {
        const baseName = file.name.replace(/\.(pdf|epub|docx?|txt|md)$/i, '')
        setTitle(baseName)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dosya okunamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/texts">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Yeni Metin Ekle</h1>
        <p className="text-slate-600 mt-1">
          Metninizi yapıştırın veya dosya yükleyin
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Metin Bilgileri</CardTitle>
          <CardDescription>
            Metninize bir başlık verin ve içeriği yapıştırın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Başlık</Label>
              <Input
                id="title"
                type="text"
                placeholder="Örn: İngilizce Makale - Climate Change"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Dosya Yükle (Opsiyonel)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".txt,.md,.pdf,.epub,.doc,.docx"
                  onChange={handleFileUpload}
                  disabled={loading}
                  className="cursor-pointer"
                />
                <Upload className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500">
                PDF, EPUB, DOC, DOCX, TXT veya MD (maks 10MB)
              </p>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">İçerik</Label>
              <Textarea
                id="content"
                placeholder="Metninizi buraya yapıştırın..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={loading}
                rows={15}
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500">
                {content.length} karakter
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Metni Kaydet
                  </>
                )}
              </Button>
              <Link href="/texts">
                <Button type="button" variant="outline" disabled={loading}>
                  İptal
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
