'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, BookOpen } from 'lucide-react';
import { summarizeBook } from '@/services/ai';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
}

export default function SummaryModal({ isOpen, onClose, content, title }: SummaryModalProps) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && content) {
      setLoading(true);
      summarizeBook(content).then(res => {
        setSummary(res);
        setLoading(false);
      });
    } else {
      setSummary('');
    }
  }, [isOpen, content]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-zinc-900 border border-purple-500/30 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative overflow-hidden"
        >
          {/* Arka Plan Efekti */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 blur-3xl rounded-full pointer-events-none" />

          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X /></button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">AI Hızlı Özet</h3>
              <p className="text-xs text-zinc-500 line-clamp-1">{title}</p>
            </div>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-4 min-h-[150px] max-h-[60vh] overflow-y-auto border border-zinc-700/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-3 py-8">
                <Sparkles className="animate-spin text-purple-500" size={32} />
                <p className="text-sm text-zinc-400 animate-pulse">Yapay zeka kitabı okuyor...</p>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm">
                <div className="whitespace-pre-line leading-relaxed text-zinc-200">
                  {summary}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2">
              <BookOpen size={18} /> Tamamını Oku
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
