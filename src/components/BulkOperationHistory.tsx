'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, Undo2, Loader2 } from 'lucide-react'
import { getBulkOperationHistory, undoBulkOperation, type BulkOperation } from '@/lib/bulkOperationsService'
import toast from 'react-hot-toast'

const OPERATION_LABELS: Record<string, string> = {
  delete: 'Toplu silme',
  update_category: 'Kategori güncelleme',
  update_level: 'Seviye güncelleme',
  add_to_collection: 'Koleksiyona ekleme',
  remove_from_collection: 'Koleksiyondan çıkarma',
  translate: 'Toplu çeviri',
  generate_definitions: 'Tanım oluşturma'
}

interface BulkOperationHistoryProps {
  userId: string
  onUndo: (operationId: string) => void
  refreshTrigger?: number
}

export default function BulkOperationHistory({
  userId,
  onUndo,
  refreshTrigger = 0
}: BulkOperationHistoryProps) {
  const [operations, setOperations] = useState<BulkOperation[]>([])
  const [loading, setLoading] = useState(true)
  const [undoingId, setUndoingId] = useState<string | null>(null)

  const loadHistory = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await getBulkOperationHistory(userId)
      setOperations(data)
    } catch (err) {
      console.error('Bulk operation history error:', err)
      toast.error('Geçmiş yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, refreshTrigger])

  const handleUndo = async (operationId: string) => {
    setUndoingId(operationId)
    try {
      await undoBulkOperation(operationId, userId)
      toast.success('İşlem geri alındı')
      onUndo(operationId)
      loadHistory()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Geri alınamadı')
    } finally {
      setUndoingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Az önce'
    if (diffMins < 60) return `${diffMins} dk önce`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} saat önce`
    return d.toLocaleDateString('tr-TR')
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
        <History size={20} className="text-gray-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">İşlem Geçmişi</h3>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-blue-600" />
          </div>
        ) : operations.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
            Henüz toplu işlem yok
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            <AnimatePresence>
              {operations.map((op) => (
                <motion.li
                  key={op.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {OPERATION_LABELS[op.operation_type] || op.operation_type}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          op.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                            : op.status === 'failed'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {op.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {op.affected_word_ids.length} kelime · {formatDate(op.created_at)}
                    </p>
                  </div>
                  {op.status === 'completed' && (
                    <button
                      onClick={() => handleUndo(op.id)}
                      disabled={undoingId === op.id}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Geri al"
                    >
                      {undoingId === op.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Undo2 size={18} />
                      )}
                    </button>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  )
}
