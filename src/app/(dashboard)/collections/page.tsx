'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import {
  getCollections,
  getTemplateCollections,
  deleteCollection,
  cloneTemplateCollection
} from '@/lib/collectionsService'
import { initializeTemplateCollections } from '@/app/actions/collections'
import CreateCollectionModal from '@/components/CreateCollectionModal'
import TemplatesModal from '@/components/TemplatesModal'
import ExportCollectionModal from '@/components/ExportCollectionModal'
import ImportCollectionModal from '@/components/ImportCollectionModal'
import type { Collection } from '@/types/collection'
import { FolderOpen, Plus, LayoutTemplate, Upload } from 'lucide-react'
import ShareCollectionModal from '@/components/ShareCollectionModal'
import { toast } from 'react-hot-toast'

function CollectionCard({
  collection,
  onDelete,
  onClone,
  onView,
  onStartFlashcard,
  onExport,
  onShare
}: {
  collection: Collection
  onDelete: () => void
  onClone?: () => void
  onView: () => void
  onStartFlashcard: () => void
  onExport?: () => void
  onShare?: () => void
}) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
    orange: 'from-orange-500 to-orange-600',
    cyan: 'from-cyan-500 to-cyan-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
    pink: 'from-pink-500 to-pink-600',
    teal: 'from-teal-500 to-teal-600'
  }

  const gradientClass = colorClasses[collection.color] || colorClasses.blue

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${gradientClass} rounded-xl p-6 text-white shadow-lg relative overflow-hidden`}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full -mr-12 -mt-12" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white rounded-full -ml-10 -mb-10" />
      </div>

      <div className="relative z-10">
        <div className="text-5xl mb-3">{collection.icon}</div>
        <h3 className="text-xl font-bold mb-2">{collection.name}</h3>
        <p className="text-white/80 text-sm mb-4 line-clamp-2">
          {collection.description || 'Açıklama yok'}
        </p>

        <div className="flex items-center gap-2 text-sm mb-4">
          <span>📚 {collection.word_count || 0} kelime</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onView}
            className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all"
          >
            👁️ Görüntüle
          </button>
          {collection.word_count && collection.word_count > 0 && (
            <button
              onClick={onStartFlashcard}
              className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all"
            >
              🎴 Çalış
            </button>
          )}
          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onShare()
              }}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Paylaş"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          )}
          {onExport && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onExport()
              }}
              className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all"
            >
              📤 Dışa Aktar
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-2">
          {collection.is_template ? (
            <button
              onClick={() => onClone?.()}
              className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all"
            >
              📋 Kopyala
            </button>
          ) : (
            <button
              onClick={onDelete}
              className="flex-1 px-4 py-2 bg-red-500/80 hover:bg-red-600 backdrop-blur-sm rounded-lg font-medium transition-all"
            >
              🗑️ Sil
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function CollectionsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [collections, setCollections] = useState<Collection[]>([])
  const [templates, setTemplates] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [selectedCollectionForExport, setSelectedCollectionForExport] = useState<Collection | null>(null)
  const [selectedCollectionForShare, setSelectedCollectionForShare] = useState<Collection | null>(null)

  const loadData = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const [cols, tmpl] = await Promise.all([
        getCollections(user.id),
        getTemplateCollections()
      ])
      setCollections(cols)
      setTemplates(tmpl)
    } catch (err) {
      console.error('Collections load error:', err)
      toast.error('Koleksiyonlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const initTemplates = async () => {
      if (typeof window !== 'undefined') {
        const key = 'zenith_templates_v1'
        if (!localStorage.getItem(key)) {
          const result = await initializeTemplateCollections()
          if (result.success) {
            localStorage.setItem(key, 'true')
          }
        }
      }
    }

    initTemplates()
    loadData()
  }, [user, router])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" koleksiyonunu silmek istediğinize emin misiniz?`)) return
    try {
      await deleteCollection(id)
      toast.success('Koleksiyon silindi')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Silinemedi')
    }
  }

  const handleCloneTemplate = async (templateId: string) => {
    if (!user?.id) return
    try {
      await cloneTemplateCollection(user.id, templateId)
      toast.success('Koleksiyon kopyalandı!')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Kopyalanamadı')
    }
  }

  const handleShare = (collection: Collection) => {
    setSelectedCollectionForShare(collection)
    setShowShareModal(true)
  }

  const handleShareToggle = (enabled: boolean, token: string | null) => {
    if (!selectedCollectionForShare) return
    setSelectedCollectionForShare(prev =>
      prev ? { ...prev, is_public: enabled, share_enabled: enabled, share_token: token } : null
    )
    setCollections(prev =>
      prev.map(c =>
        c.id === selectedCollectionForShare.id
          ? { ...c, is_public: enabled, share_enabled: enabled, share_token: token }
          : c
      )
    )
  }

  if (authLoading || (!user && !authLoading) || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <FolderOpen size={28} />
              Koleksiyonlar
            </h1>
            <p className="text-gray-400 mt-1">
              Kelimelerinizi koleksiyonlara gruplayın
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors"
            >
              <Upload size={20} />
              İçe Aktar
            </button>
            <button
              onClick={() => setShowTemplatesModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
            >
              <LayoutTemplate size={20} />
              Şablonlar
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
            >
              <Plus size={20} />
              Yeni Koleksiyon
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {/* Kullanıcı koleksiyonları */}
            {collections.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-white mb-4">Koleksiyonlarım</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {collections.map((col) => (
                    <CollectionCard
                      key={col.id}
                      collection={col}
                      onDelete={() => handleDelete(col.id, col.name)}
                      onView={() => router.push(`/collections/${col.id}`)}
                      onStartFlashcard={() => router.push(`/flashcards?collection=${col.id}`)}
                      onExport={() => {
                        setSelectedCollectionForExport(col)
                        setShowExportModal(true)
                      }}
                      onShare={() => handleShare(col)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Şablon koleksiyonlar */}
            {templates.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-white mb-4">Şablon Koleksiyonlar</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {templates.map((collection) => (
                    <CollectionCard
                      key={collection.id}
                      collection={collection}
                      onDelete={() => {}}
                      onClone={() => handleCloneTemplate(collection.id)}
                      onView={() => router.push(`/collections/${collection.id}`)}
                      onStartFlashcard={() => router.push(`/flashcards?collection=${collection.id}`)}
                      onExport={() => {
                        setSelectedCollectionForExport(collection)
                        setShowExportModal(true)
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Boş durum */}
            {collections.length === 0 && templates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6 rounded-xl border border-dashed border-gray-600 bg-gray-900/50">
                <FolderOpen className="w-16 h-16 text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Henüz koleksiyon yok</h3>
                <p className="text-gray-400 text-center mb-6">
                  Yeni koleksiyon oluşturarak veya şablonlardan birini kopyalayarak başlayın.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
                >
                  <Plus size={20} />
                  Yeni Koleksiyon
                </button>
              </div>
            )}
          </>
        )}

        <CreateCollectionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={loadData}
        />
        {selectedCollectionForExport && (
          <ExportCollectionModal
            isOpen={showExportModal}
            onClose={() => {
              setShowExportModal(false)
              setSelectedCollectionForExport(null)
            }}
            collection={selectedCollectionForExport}
          />
        )}
        <ImportCollectionModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          userId={user!.id}
          onImported={loadData}
        />
        <TemplatesModal
          isOpen={showTemplatesModal}
          onClose={() => setShowTemplatesModal(false)}
          templates={templates}
          onClone={handleCloneTemplate}
        />
        {showShareModal && user && selectedCollectionForShare && (
          <ShareCollectionModal
            collectionId={selectedCollectionForShare.id}
            collectionName={selectedCollectionForShare.name}
            userId={user.id}
            isShared={selectedCollectionForShare.share_enabled ?? false}
            shareToken={selectedCollectionForShare.share_token ?? null}
            onClose={() => {
              setShowShareModal(false)
              setSelectedCollectionForShare(null)
            }}
            onToggleShare={handleShareToggle}
          />
        )}
      </div>
    </div>
  )
}
