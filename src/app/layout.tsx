import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Toaster } from 'react-hot-toast'
import { Toaster as SonnerToaster } from 'sonner'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: {
    default: 'Zenith Vocab - Akıllı Kelime Öğrenme Platformu',
    template: '%s | Zenith Vocab'
  },
  description:
    'Spaced Repetition ve AI destekli kelime öğrenme platformu. Koleksiyonlar oluşturun, paylaşın ve etkili bir şekilde öğrenin.',
  keywords: ['kelime öğrenme', 'vocabulary', 'flashcard', 'spaced repetition', 'AI', 'İngilizce'],
  authors: [{ name: 'Zenith Vocab' }],
  creator: 'Zenith Vocab',
  publisher: 'Zenith Vocab',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: '/',
    siteName: 'Zenith Vocab',
    title: 'Zenith Vocab - Akıllı Kelime Öğrenme Platformu',
    description: 'Spaced Repetition ve AI destekli kelime öğrenme platformu',
    images: [
      {
        url: '/api/og?title=Zenith%20Vocab&icon=%F0%9F%93%9A&words=&color=%233b82f6',
        width: 1200,
        height: 630,
        alt: 'Zenith Vocab'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zenith Vocab - Akıllı Kelime Öğrenme Platformu',
    description: 'Spaced Repetition ve AI destekli kelime öğrenme platformu',
    images: ['/api/og?title=Zenith%20Vocab&icon=%F0%9F%93%9A&words=&color=%233b82f6']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Zenith Vocab'
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#030712' }
  ]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                className: '',
                style: {
                  background: '#1f2937',
                  color: '#fff',
                  border: '1px solid #374151'
                },
                success: {
                  duration: 2000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff'
                  }
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff'
                  }
                },
                loading: {
                  iconTheme: {
                    primary: '#3b82f6',
                    secondary: '#fff'
                  }
                }
              }}
            />
            <SonnerToaster position="top-right" richColors />
          </AuthProvider>
        </ThemeProvider>
        
        {/* Service Worker - sadece production'da (dev'de stale cache fetch hatası verir) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (${process.env.NODE_ENV === 'production'} && 'serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('[SW] Registered'))
                    .catch(err => console.log('[SW] Failed:', err))
                })
              } else if (${process.env.NODE_ENV !== 'production'} && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))
              }
            `
          }}
        />
      </body>
    </html>
  )
}
