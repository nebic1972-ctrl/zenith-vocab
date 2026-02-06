'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Home, BarChart3, Settings, Menu, X, FolderOpen } from 'lucide-react'
import { useState } from 'react'
import DarkModeToggle from './DarkModeToggle'

export default function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/', label: 'Ana Sayfa', icon: Home },
    { href: '/flashcards', label: 'Flashcards', icon: BookOpen },
    { href: '/collections', label: 'Koleksiyonlar', icon: FolderOpen },
    { href: '/vocabulary', label: 'Sözlüğüm', icon: BookOpen },
    { href: '/statistics', label: 'İstatistikler', icon: BarChart3 },
    { href: '/settings', label: 'Ayarlar', icon: Settings },
  ]

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-stone-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">Z</span>
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-white">Zenith Vocab</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <DarkModeToggle />
            <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-3">
            <DarkModeToggle />
            <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          </div>
        </div>
      </div>

      {/* Mobil Menü (Açılır Panel) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
