'use client'

import { motion } from 'framer-motion'
import {
  FolderPlus,
  FolderMinus,
  Trash2,
  Tag,
  BarChart3,
  Download,
  Languages,
  X
} from 'lucide-react'

export interface BulkActionBarProps {
  selectedCount: number
  onAddToCollection: () => void
  onRemoveFromCollection: () => void
  onDelete: () => void
  onChangeCategory: () => void
  onChangeLevel: () => void
  onExport: () => void
  onTranslate: () => void
  onClearSelection: () => void
}

export default function BulkActionBar({
  selectedCount,
  onAddToCollection,
  onRemoveFromCollection,
  onDelete,
  onChangeCategory,
  onChangeLevel,
  onExport,
  onTranslate,
  onClearSelection
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  const actions = [
    { icon: FolderPlus, label: 'Koleksiyona ekle', onClick: onAddToCollection },
    { icon: FolderMinus, label: 'Koleksiyondan çıkar', onClick: onRemoveFromCollection },
    { icon: Tag, label: 'Kategori değiştir', onClick: onChangeCategory },
    { icon: BarChart3, label: 'Seviye değiştir', onClick: onChangeLevel },
    { icon: Languages, label: 'Çevir (AI)', onClick: onTranslate },
    { icon: Download, label: 'Dışa aktar', onClick: onExport }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-md"
    >
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded-lg font-medium">
              {selectedCount} kelime seçili
            </span>
            <button
              onClick={onClearSelection}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Seçimi temizle"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {actions.map(({ icon: Icon, label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
              Sil
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
