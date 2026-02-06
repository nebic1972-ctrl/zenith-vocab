'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface LibraryText {
  id: string
  title: string
  content_text: string
  file_type: string
  created_at: string
}

export default function TextsPage() {
  const [texts, setTexts] = useState<LibraryText[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTexts()
  }, [])

  const loadTexts = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('library')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTexts((data || []) as LibraryText[])
    } catch (error) {
      console.error('Metinler yüklenemedi:', error)
      toast.error('Metinler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const deleteText = async (id: string) => {
    if (!confirm('Bu metni silmek istediğinizden emin misiniz?')) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('library')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      setTexts(texts.filter(t => t.id !== id))
      toast.success('Metin silindi')
    } catch (error) {
      console.error('Metin silinemedi:', error)
      toast.error('Metin silinemedi')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Metinlerim</h1>
          <p className="text-slate-600 mt-1">
            Metinlerinizi yükleyin ve kelime öğrenmeye başlayın
          </p>
        </div>
        <Link href="/texts/new">
          <Button size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Yeni Metin
          </Button>
        </Link>
      </div>

      {/* Texts Grid */}
      {texts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              Henüz metin yüklemediniz
            </h3>
            <p className="text-slate-500 mb-6 text-center max-w-md">
              İlk metninizi yükleyin ve içinden kelime seçerek öğrenmeye başlayın
            </p>
            <Link href="/texts/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                İlk Metni Yükle
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {texts.map((text) => (
            <Card key={text.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-1">{text.title}</CardTitle>
                <CardDescription>
                  {new Date(text.created_at).toLocaleDateString('tr-TR')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm line-clamp-3 mb-4">
                  {text.content_text || ''}
                </p>
                <div className="flex gap-2">
                  <Link href={`/texts/${text.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Görüntüle
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deleteText(text.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
