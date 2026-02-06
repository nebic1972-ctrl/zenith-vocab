'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'

interface DarkModeToggleProps {
  /** Kompakt mod (navbar için) - default: true */
  compact?: boolean
  /** Ek sınıflar */
  className?: string
}

export default function DarkModeToggle({ compact = true, className = '' }: DarkModeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        inline-flex items-center justify-center rounded-lg
        border border-slate-200 dark:border-slate-700
        bg-white dark:bg-slate-800
        hover:bg-slate-50 dark:hover:bg-slate-700
        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900
        ${compact ? 'w-10 h-10' : 'w-12 h-12'}
        ${className}
      `}
      aria-label={isDark ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 180 : 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {isDark ? (
          <Moon className="w-5 h-5 text-slate-300" aria-hidden />
        ) : (
          <Sun className="w-5 h-5 text-amber-500" aria-hidden />
        )}
      </motion.div>
    </motion.button>
  )
}
