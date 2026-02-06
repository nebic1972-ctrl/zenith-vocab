import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import SharedCollectionClient from './SharedCollectionClient'

interface Props {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const supabase = await createClient()

  try {
    const { data: collection } = await supabase
      .from('collections')
      .select('id, name, description, icon, color')
      .eq('share_token', token)
      .eq('share_enabled', true)
      .single()

    if (!collection) {
      return {
        title: 'Koleksiyon Bulunamadı',
        description: 'Bu koleksiyon artık mevcut değil.'
      }
    }

    const { count } = await supabase
      .from('collection_words')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', collection.id)

    const wordCount = count || 0
    const title = `${collection.icon} ${collection.name} - ${wordCount} Kelime`
    const description =
      collection.description ||
      `${wordCount} kelime içeren "${collection.name}" koleksiyonunu keşfedin ve kendi kelime dağarcığınıza ekleyin!`

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl = `${baseUrl}/shared/${token}`

    const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(collection.name)}&icon=${encodeURIComponent(collection.icon)}&words=${wordCount}&color=${encodeURIComponent(collection.color)}`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: shareUrl,
        siteName: 'Zenith Vocab',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: collection.name
          }
        ],
        locale: 'tr_TR',
        type: 'website'
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
        creator: '@zenithvocab'
      },
      alternates: {
        canonical: shareUrl
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Zenith Vocab - Kelime Koleksiyonu',
      description: 'Kelime öğrenme platformu'
    }
  }
}

export default async function SharedCollectionPage({ params }: Props) {
  const { token } = await params
  return <SharedCollectionClient token={token} />
}
