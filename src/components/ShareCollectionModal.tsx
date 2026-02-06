'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  enableCollectionSharing,
  disableCollectionSharing,
  generateShareUrl,
  generateSocialShareUrls
} from '@/lib/sharingService'
import QRCode from 'qrcode'

interface ShareCollectionModalProps {
  collectionId: string
  collectionName: string
  userId: string
  isShared: boolean
  shareToken: string | null
  onClose: () => void
  onToggleShare: (enabled: boolean, token: string | null) => void
}

export default function ShareCollectionModal({
  collectionId,
  collectionName,
  userId,
  isShared: initialIsShared,
  shareToken: initialShareToken,
  onClose,
  onToggleShare
}: ShareCollectionModalProps) {
  const [isShared, setIsShared] = useState(initialIsShared)
  const [shareToken, setShareToken] = useState(initialShareToken)
  const [loading, setLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const shareUrl = shareToken ? generateShareUrl(shareToken) : ''
  const socialUrls = shareToken ? generateSocialShareUrls(shareToken, collectionName) : null

  // Sync with parent when props change
  useEffect(() => {
    setIsShared(initialIsShared)
    setShareToken(initialShareToken)
  }, [initialIsShared, initialShareToken])

  // Generate QR code
  useEffect(() => {
    if (shareUrl) {
      QRCode.toDataURL(shareUrl, { width: 200, margin: 1 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('QR code error:', err))
    } else {
      setQrCodeUrl('')
    }
  }, [shareUrl])

  const handleToggleShare = async () => {
    setLoading(true)

    try {
      if (isShared) {
        // Disable sharing
        await disableCollectionSharing(collectionId, userId)
        setIsShared(false)
        setShareToken(null)
        onToggleShare(false, null)
        toast.success('Paylaşım devre dışı bırakıldı')
      } else {
        // Enable sharing
        const token = await enableCollectionSharing(collectionId, userId)
        setIsShared(true)
        setShareToken(token)
        onToggleShare(true, token)
        toast.success('Paylaşım etkinleştirildi')
      }
    } catch (error) {
      console.error('Error toggling share:', error)
      toast.error('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (!shareUrl) return

    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Link kopyalandı')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return

    const link = document.createElement('a')
    link.download = `${collectionName}-qr.png`
    link.href = qrCodeUrl
    link.click()
    toast.success('QR kod indirildi')
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              🔗 Koleksiyonu Paylaş
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Collection Name */}
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {collectionName}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Bu koleksiyonu herkese açık hale getirin
              </p>
            </div>

            {/* Toggle Share */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Paylaşımı Etkinleştir
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {isShared ? 'Koleksiyon herkese açık' : 'Koleksiyon özel'}
                </div>
              </div>
              <button
                onClick={handleToggleShare}
                disabled={loading}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  isShared ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-700'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    isShared ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Share Link */}
            {isShared && shareUrl && (
              <>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Paylaşım Linki
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      {copied ? '✓' : '📋'}
                    </button>
                  </div>
                </div>

                {/* QR Code */}
                {qrCodeUrl && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      QR Kod
                    </label>
                    <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        className="w-48 h-48 border-4 border-white dark:border-gray-700 rounded-lg"
                      />
                      <button
                        onClick={handleDownloadQR}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        📥 QR Kodu İndir
                      </button>
                    </div>
                  </div>
                )}

                {/* Social Share */}
                {socialUrls && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sosyal Medyada Paylaş
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <a
                        href={socialUrls.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 p-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors"
                      >
                        <span className="text-2xl">𝕏</span>
                        <span className="text-xs font-medium">Twitter</span>
                      </a>
                      <a
                        href={socialUrls.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 p-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg transition-colors"
                      >
                        <span className="text-2xl">💬</span>
                        <span className="text-xs font-medium">WhatsApp</span>
                      </a>
                      <a
                        href={socialUrls.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 p-3 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-lg transition-colors"
                      >
                        <span className="text-2xl">✈️</span>
                        <span className="text-xs font-medium">Telegram</span>
                      </a>
                      <a
                        href={socialUrls.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 p-3 bg-[#0077b5] hover:bg-[#006399] text-white rounded-lg transition-colors"
                      >
                        <span className="text-2xl">💼</span>
                        <span className="text-xs font-medium">LinkedIn</span>
                      </a>
                      <a
                        href={socialUrls.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 p-3 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-lg transition-colors"
                      >
                        <span className="text-2xl">📘</span>
                        <span className="text-xs font-medium">Facebook</span>
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Kapat
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
