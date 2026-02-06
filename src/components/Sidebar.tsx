'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Filter } from 'lucide-react'

export interface FilterState {
  categories: string[]
  levels: string[]
}

interface SidebarProps {
  onFilterChange?: (filters: FilterState) => void
}

export default function Sidebar({ onFilterChange }: SidebarProps) {
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [levelsOpen, setLevelsOpen] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])

  const categories = [
    { id: 'business', label: 'İş İngilizcesi', count: 8 },
    { id: 'academic', label: 'Akademik', count: 12 },
    { id: 'daily', label: 'Günlük Konuşma', count: 15 },
    { id: 'technical', label: 'Teknik', count: 6 },
    { id: 'travel', label: 'Seyahat', count: 4 },
  ]

  const levels = [
    { id: 'A1', label: 'A1 - Başlangıç', count: 3 },
    { id: 'A2', label: 'A2 - Temel', count: 5 },
    { id: 'B1', label: 'B1 - Orta', count: 8 },
    { id: 'B2', label: 'B2 - Orta Üstü', count: 6 },
    { id: 'C1', label: 'C1 - İleri', count: 3 },
    { id: 'C2', label: 'C2 - Uzman', count: 1 },
  ]

  const toggleCategory = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(c => c !== categoryId)
      : [...selectedCategories, categoryId]
    
    setSelectedCategories(newCategories)
    onFilterChange?.({ categories: newCategories, levels: selectedLevels })
  }

  const toggleLevel = (levelId: string) => {
    const newLevels = selectedLevels.includes(levelId)
      ? selectedLevels.filter(l => l !== levelId)
      : [...selectedLevels, levelId]
    
    setSelectedLevels(newLevels)
    onFilterChange?.({ categories: selectedCategories, levels: newLevels })
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedLevels([])
    onFilterChange?.({ categories: [], levels: [] })
  }

  return (
    <aside className="w-64 bg-white border-r border-stone-200 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <div className="p-4">
        
        {/* Başlık */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-slate-600" />
            <h2 className="font-bold text-slate-800">Filtreler</h2>
          </div>
          {(selectedCategories.length > 0 || selectedLevels.length > 0) && (
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Temizle
            </button>
          )}
        </div>

        {/* Kategoriler */}
        <div className="mb-6">
          <button
            onClick={() => setCategoriesOpen(!categoriesOpen)}
            className="flex items-center justify-between w-full mb-3 text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            <span>Kategoriler</span>
            {categoriesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {categoriesOpen && (
            <div className="space-y-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="w-4 h-4 text-blue-600 rounded border-stone-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 flex-1">{category.label}</span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {category.count}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Seviyeler */}
        <div>
          <button
            onClick={() => setLevelsOpen(!levelsOpen)}
            className="flex items-center justify-between w-full mb-3 text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            <span>Seviye</span>
            {levelsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {levelsOpen && (
            <div className="space-y-2">
              {levels.map((level) => (
                <label
                  key={level.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedLevels.includes(level.id)}
                    onChange={() => toggleLevel(level.id)}
                    className="w-4 h-4 text-blue-600 rounded border-stone-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 flex-1">{level.label}</span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {level.count}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Aktif Filtreler Özeti */}
        {(selectedCategories.length > 0 || selectedLevels.length > 0) && (
          <div className="mt-6 pt-6 border-t border-stone-200">
            <p className="text-xs font-semibold text-slate-600 mb-2">AKTİF FİLTRELER</p>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map(catId => {
                const cat = categories.find(c => c.id === catId)
                return (
                  <span key={catId} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                    {cat?.label}
                  </span>
                )
              })}
              {selectedLevels.map(lvl => (
                <span key={lvl} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                  {lvl}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
