'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Collection } from '@/types/collection'

interface TemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  templates: Collection[]
  onClone: (templateId: string) => void
}

export default function TemplatesModal({
  isOpen,
  onClose,
  templates,
  onClone
}: TemplatesModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                ✨ Şablon Koleksiyonlar
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Hazır koleksiyonları kopyalayarak hızlıca başlayın
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Templates Grid */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.02 }}
                className={`bg-gradient-to-br from-${template.color}-500 to-${template.color}-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden`}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -mr-12 -mt-12"></div>
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-white rounded-full -ml-10 -mb-10"></div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="text-5xl mb-3">{template.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{template.name}</h3>
                  <p className="text-white/80 text-sm mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  <button
                    onClick={() => {
                      onClone(template.id)
                      onClose()
                    }}
                    className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all"
                  >
                    📋 Kopyala
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
            >
              Kapat
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
