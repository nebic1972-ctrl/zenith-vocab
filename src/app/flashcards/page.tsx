import { Suspense } from 'react'
import FlashcardsContent from './FlashcardsContent'

export default function FlashcardsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mb-4" />
            <p className="text-gray-400">Kelimeler yükleniyor...</p>
          </div>
        </div>
      }
    >
      <FlashcardsContent />
    </Suspense>
  )
}
