"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface RSVPEngineProps {
  content: string;
  wpm: number;
  isPlaying: boolean;
  onIndexChange?: (index: number) => void;
  onComplete?: () => void;
  startIndex?: number;
  fontSize?: 'small' | 'medium' | 'large' | 'huge';
}

/**
 * RSVPEngine - Rapid Serial Visual Presentation Engine
 * Displays words one-by-one at a specific speed (WPM) with ORP highlighting.
 */
export default function RSVPEngine({
  content,
  wpm,
  isPlaying,
  onIndexChange,
  onComplete,
  startIndex = 0,
  fontSize = 'large',
}: RSVPEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [words, setWords] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean and split content into words
  useEffect(() => {
    if (!content) {
      setWords([]);
      return;
    }

    const cleanedContent = content
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const wordList = cleanedContent.split(' ').filter(w => w.length > 0);
    setWords(wordList);
  }, [content]);

  // Sync startIndex with internal state (separate effect for better control)
  useEffect(() => {
    if (words.length === 0) return;
    const validStartIndex = Math.min(startIndex, Math.max(0, words.length - 1));
    setCurrentIndex(validStartIndex);
  }, [startIndex, words.length]);

  // Notify parent of index changes
  useEffect(() => {
    if (onIndexChange) {
      onIndexChange(currentIndex);
    }
  }, [currentIndex, onIndexChange]);

  // RSVP Timer Logic
  useEffect(() => {
    if (!isPlaying || words.length === 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Calculate interval from WPM: ms per word = 60000 / wpm
    const intervalMs = Math.max(50, 60000 / wpm);

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        
        // Check if we've reached the end
        if (nextIndex >= words.length) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          if (onComplete) {
            onComplete();
          }
          return prev; // Stay at last word
        }
        
        return nextIndex;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, wpm, words.length, onComplete]);

  /**
   * Calculate Optimal Recognition Point (ORP)
   * The ORP is typically around 30-40% into the word, which is where the eye
   * naturally focuses for fastest recognition.
   */
  const getORP = (word: string): { before: string; center: string; after: string } => {
    if (!word || word.length === 0) {
      return { before: '', center: '', after: '' };
    }

    // For very short words, highlight the whole word or middle
    if (word.length <= 1) {
      return { before: '', center: word, after: '' };
    }
    
    if (word.length === 2) {
      return { before: word[0], center: word[1], after: '' };
    }

    if (word.length === 3) {
      return { before: word[0], center: word[1], after: word[2] };
    }

    // ORP calculation: approximately 35-40% into the word
    // This is where the eye naturally focuses for fastest recognition
    const orpIndex = Math.floor(word.length * 0.35);
    
    return {
      before: word.slice(0, orpIndex),
      center: word[orpIndex],
      after: word.slice(orpIndex + 1),
    };
  };

  // Get font size classes
  const getFontSizeClasses = () => {
    switch (fontSize) {
      case 'small':
        return 'text-4xl md:text-5xl';
      case 'medium':
        return 'text-5xl md:text-6xl';
      case 'large':
        return 'text-6xl md:text-7xl';
      case 'huge':
        return 'text-7xl md:text-8xl';
      default:
        return 'text-6xl md:text-7xl';
    }
  };

  const currentWord = words[currentIndex] || '';
  const orp = getORP(currentWord);

  // Allow external control of index
  const setIndex = useCallback((newIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(newIndex, words.length - 1));
    setCurrentIndex(clampedIndex);
  }, [words.length]);

  // Expose setIndex for parent components
  useEffect(() => {
    (window as any).__rsvpSetIndex = setIndex;
    return () => {
      delete (window as any).__rsvpSetIndex;
    };
  }, [setIndex]);

  if (words.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-500 text-xl">İçerik yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      {/* Main Word Display */}
      <div className="relative flex items-center justify-center min-h-[200px] w-full max-w-4xl px-4">
        {/* ORP Guide Line (vertical red line) */}
        <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-red-500/20" />
        
        {/* Word Container */}
        <div className={cn(
          "font-black tracking-tight text-center whitespace-nowrap",
          getFontSizeClasses()
        )}>
          {/* ORP Highlighting */}
          <span className="text-zinc-500">{orp.before}</span>
          <span className="text-red-500 relative">
            {orp.center}
            {/* Focus dot below the red letter */}
            <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </span>
          <span className="text-zinc-500">{orp.after}</span>
        </div>
      </div>

      {/* ORP Guide Markers */}
      <div className="flex items-center justify-center gap-4 mt-8 text-zinc-600">
        <div className="h-px w-16 bg-zinc-800" />
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <div className="h-px w-16 bg-zinc-800" />
      </div>
    </div>
  );
}

// Export type for parent components
export type { RSVPEngineProps };
