'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { createCollection } from '@/lib/collectionsService'
import { COLLECTION_COLORS, COLLECTION_ICONS } from '@/types/collection'

interface CreateCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

export default function CreateCollectionModal({
  isOpen,
  onClose,
  onCreated
}: CreateCollectionModalProps) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('📚')
  const [selectedColor, setSelectedColor] = useState('blue')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Koleksiyon adı zorunludur')
      return
    }

    setLoading(true)

    try {
      await createCollection(
        user!.id,
        name.trim(),
        description.trim(),
        selectedIcon,
        selectedColor
      )

      toast.success('✅ Koleksiyon oluşturuldu!')
      setName('')
      setDescription('')
      setSelectedIcon('📚')
      setSelectedColor('blue')
      onCreated()
      onClose()
    } catch (error) {
      console.error('Error creating collection:', error)
      toast.error('Koleksiyon oluşturulamadı')
    } finally {
      setLoading(false)
    }
  }

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
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              ➕ Yeni Koleksiyon
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Koleksiyon Adı *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="örn: Business English"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Açıklama
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Bu koleksiyon hakkında kısa bir açıklama..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
                maxLength={500}
              />
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                İkon Seç
              </label>
              <div className="grid grid-cols-7 gap-2">
                {COLLECTION_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`text-3xl p-2 rounded-lg transition-all ${
                      selectedIcon === icon
                        ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500 scale-110'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Renk Seç
              </label>
              <div className="grid grid-cols-5 gap-2">
                {COLLECTION_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`h-12 rounded-lg transition-all bg-${color}-500 ${
                      selectedColor === color
                        ? 'ring-4 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900 scale-110'
                        : 'hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Önizleme:</p>
              <div className={`bg-gradient-to-br from-${selectedColor}-500 to-${selectedColor}-600 rounded-xl p-4 text-white`}>
                <div className="text-4xl mb-2">{selectedIcon}</div>
                <h3 className="font-bold text-lg">{name || 'Koleksiyon Adı'}</h3>
                <p className="text-sm text-white/80 mt-1">
                  {description || 'Açıklama...'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
              >
                {loading ? '⏳ Oluşturuluyor...' : '✅ Oluştur'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
