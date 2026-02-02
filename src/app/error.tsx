'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps): JSX.Element {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-reading-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 max-w-md w-full text-center"
      >
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-reading-text mb-2">
          Bir şeyler ters gitti
        </h1>
        <p className="text-reading-text/70 text-sm mb-6">
          Üzgünüz, beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
        </p>
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-4 p-3 bg-slate-100 rounded text-left">
            <p className="text-xs font-mono text-slate-600 break-words">
              {error.message}
            </p>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <motion.button
            onClick={reset}
            className="px-6 py-3 bg-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 min-h-[44px] touch-manipulation"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Tekrar Dene
          </motion.button>
          <Link
            href="/dashboard"
            className="px-6 py-3 border border-slate-200 text-reading-text rounded-lg font-medium hover:bg-slate-50 transition-colors text-center min-h-[44px] touch-manipulation flex items-center justify-center"
          >
            Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
