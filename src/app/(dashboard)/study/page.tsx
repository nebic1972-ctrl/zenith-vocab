import { Suspense } from 'react'
import StudyContent from './StudyContent'

export default function StudyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Kelimeler yükleniyor...</p>
          </div>
        </div>
      }
    >
      <StudyContent />
    </Suspense>
  )
}
