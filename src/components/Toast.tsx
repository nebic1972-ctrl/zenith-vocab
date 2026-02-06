'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      iconColor: 'text-green-600'
    },
    error: {
      icon: XCircle,
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      iconColor: 'text-red-600'
    },
    info: {
      icon: Info,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      iconColor: 'text-blue-600'
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      iconColor: 'text-amber-600'
    }
  }

  const { icon: Icon, bg, border, text, iconColor } = config[type]

  return (
    <div className={`fixed top-4 right-4 z-50 ${bg} ${border} border-2 rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in`}>
      <Icon size={24} className={iconColor} />
      <p className={`flex-1 font-medium ${text}`}>{message}</p>
      <button
        onClick={onClose}
        className={`${text} hover:opacity-70 transition-opacity`}
      >
        <X size={20} />
      </button>
    </div>
  )
}
