"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, X, ChevronLeft, ChevronRight, Settings, Maximize2, Minimize2, Music, BrainCircuit, HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useNeuroStore } from "@/store/useNeuroStore";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import ResultModal from "@/components/reader/ResultModal";
import AIQuizModal from "@/components/library/AIQuizModal";
import InstructionsModal from "@/components/ui/InstructionsModal";
import { cn } from "@/lib/utils";

interface RSVPReaderProps {
  content: string;
  initialWpm: number;
  bookId?: string;
  lastPosition?: number;
  onClose: () => void;
}

// Settings types
type FontSize = 'small' | 'medium' | 'large' | 'huge';
type FontFamily = 'sans' | 'serif' | 'mono';
type Theme = 'dark' | 'sepia';
type ChunkSize = 1 | 2 | 3 | 'auto';

interface RSVPSettings {
  fontSize: FontSize;
  fontFamily: FontFamily;
  theme: Theme;
  chunkSize: ChunkSize;
  adaptiveMode: boolean;
}

const DEFAULT_SETTINGS: RSVPSettings = {
  fontSize: 'medium',
  fontFamily: 'sans',
  theme: 'dark',
  chunkSize: 1,
  adaptiveMode: false,
};

// Load settings from localStorage
const loadSettings = (): RSVPSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem('rsvp_settings');
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load RSVP settings:', e);
  }
  return DEFAULT_SETTINGS;
};

// Save settings to localStorage
const saveSettings = (settings: RSVPSettings) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('rsvp_settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save RSVP settings:', e);
  }
};

export default function RSVPReader({ content, initialWpm, bookId, lastPosition = 0, onClose }: RSVPReaderProps) {
  const { user } = useNeuroStore();
  const library = useNeuroStore((s) => s.library);
  const addSessionStats = useNeuroStore((s) => (s as Record<string, unknown>).addSessionStats as ((a: unknown) => void) | undefined) ?? (() => {});
  const updateBookProgress = useNeuroStore((s) => (s as Record<string, unknown>).updateBookProgress as ((a: unknown) => void) | undefined) ?? (() => {});
  const updateLastWpm = useNeuroStore((s) => (s as Record<string, unknown>).updateLastWpm as ((a: unknown) => void) | undefined) ?? (() => {});
  const userSettings = useNeuroStore((s) => (s as Record<string, unknown>).userSettings) ?? {};
  const accessibilityMode = useNeuroStore((s) => (s as Record<string, unknown>).accessibilityMode) ?? false;
  const dailyPlan = useNeuroStore((s) => (s as Record<string, unknown>).dailyPlan as { date: string; tasks: unknown[] } | undefined) ?? { date: "", tasks: [] };
  const completeDailyTask = useNeuroStore((s) => (s as Record<string, unknown>).completeDailyTask as ((a: unknown) => void) | undefined) ?? (() => {});
  
  const [words, setWords] = useState<string[]>([]);
  const [originalWords, setOriginalWords] = useState<string[]>([]); // Store original word list for word count
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(180); // Default fallback, will be updated by useEffect on mount
  const [startIndex, setStartIndex] = useState(0); // Track where user started this session
  const [xpEarned, setXpEarned] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [showXpToast, setShowXpToast] = useState(false);
  const [settings, setSettings] = useState<RSVPSettings>(loadSettings());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null); // Track session start time
  const [showSummary, setShowSummary] = useState(false); // Control modal display - prevents unmount
  const [sessionData, setSessionData] = useState<{
    finalWpm: number;
    durationSeconds: number;
    wordsRead: number;
    bookTitle: string;
  } | null>(null);
  const [focusAudio, setFocusAudio] = useState<'off' | 'alpha' | 'rain' | 'white-noise' | 'custom'>('off');
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showResumeToast, setShowResumeToast] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Cleanup custom audio URL on unmount
  useEffect(() => {
    return () => {
      if (customAudioUrl) {
        URL.revokeObjectURL(customAudioUrl);
      }
    };
  }, [customAudioUrl]);

  // Handle WPM change and persist to store
  const handleWpmChange = (newWpm: number) => {
    const clamped = Math.max(100, Math.min(2000, newWpm));
    setWpm(clamped);
    // CRITICAL: Immediately persist to store
    updateLastWpm(clamped);
  };

  // FORCE load WPM from store on mount (DEFINITIVE FIX)
  useEffect(() => {
    // Force read directly from the store state
    const state = useNeuroStore.getState();
    const storedWpm = state.userSettings?.last_wpm;
    
    if (storedWpm && storedWpm > 0) {
      setWpm(storedWpm);
      console.log('✅ [WPM] Loaded from store on mount:', storedWpm);
    } else {
      // Fallback to other sources
      const fallbackWpm = state.userSettings?.wpm_speed || initialWpm || 180;
      setWpm(fallbackWpm);
      console.log('⚠️ [WPM] Using fallback:', fallbackWpm);
    }
  }, []); // Empty dependency array = Run once on mount

  // Also update when userSettings loads (in case it loads after mount)
  useEffect(() => {
    if (userSettings?.last_wpm && userSettings.last_wpm > 0) {
      setWpm(userSettings.last_wpm);
      console.log('✅ [WPM] Updated from userSettings:', userSettings.last_wpm);
    }
  }, [userSettings?.last_wpm]);

  // Get accessibility mode styles for word display
  const getModeStyles = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {};
    
    if (accessibilityMode === 'dyslexia') {
      return {
        ...baseStyle,
        fontFamily: "'Comic Sans MS', 'Chalkboard SE', sans-serif",
        letterSpacing: '0.1em',
        lineHeight: 2,
      };
    }
    
    return baseStyle;
  };

  // Get accessibility mode classes for controls (ADHD focus mode)
  const getControlOpacity = () => {
    return accessibilityMode === 'adhd_focus' ? 'opacity-50' : '';
  };

  // Save progress to database (helper function - defined early)
  const saveProgress = async (currentIndex: number) => {
    if (!bookId) return;
    await updateBookProgress(bookId, currentIndex);
  };

  // Calculate session words (helper function) - MUST be defined before handleExitAttempt
  const calculateSessionWords = (): number => {
    if (settings.chunkSize === 1) {
      // Simple case: chunks are individual words
      return Math.max(0, index - startIndex);
    } else {
      // Count actual words in chunks from startIndex to index
      const chunksRead = words.slice(startIndex, index + 1);
      return chunksRead.reduce((count, chunk) => {
        // Count words in chunk (split by space and filter empty)
        return count + chunk.split(' ').filter(w => w.length > 0).length;
      }, 0);
    }
  };

  // MASTER EXIT TRAP: Intercepts ALL close attempts (X button, Escape, Backdrop)
  // MUST be defined BEFORE any useEffect hooks that use it
  const handleExitAttempt = useCallback(async () => {
    // If modal is already showing, do nothing (let user interact with modal)
    if (showSummary) {
      return;
    }

    // Save final progress
    if (bookId && user?.id) {
      await saveProgress(index);
    }

    // Calculate words read in this session
    const sessionWords = calculateSessionWords();

    // Calculate session duration
    const durationSeconds = sessionStartTime 
      ? Math.floor((Date.now() - sessionStartTime) / 1000)
      : 0;

    // Get book title
    const currentBook = bookId ? library.find(b => b.id === bookId) : null;
    const bookTitle = currentBook?.title || 'Bilinmeyen Kitap';

    // GHOST SESSION CHECK: Only check wordsRead, NOT duration
    // Fast readers read fast, so duration is not a reliable indicator
    const isGhostSession = sessionWords < 10;
    
    if (isGhostSession) {
      // Ghost session - just close (no summary, no save, no stats update)
      console.log('👻 [GHOST-SESSION] Silent close:', { sessionWords, durationSeconds });
      onClose();
      return;
    }

    // VALID SESSION: Show summary modal
    // STOP reading immediately
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Calculate session WPM with sanity check
    // CRITICAL: Clamp to realistic maximum (3000 WPM)
    const rawSessionWpm = durationSeconds > 0 ? Math.round((sessionWords / durationSeconds) * 60) : wpm;
    const sessionWpm = Math.min(3000, rawSessionWpm); // Cap at 3000 WPM

    // Store session data and show summary modal
    setSessionData({
      finalWpm: sessionWpm,
      durationSeconds,
      wordsRead: sessionWords,
      bookTitle,
    });
    
    // IMMEDIATELY update daily plan progress - FOR DAILY GOALS SYNC
    const today = new Date().toISOString().split('T')[0];
    if (dailyPlan.date === today && sessionWords > 0) {
      const readingTask = dailyPlan.tasks.find(
        task => task.type === 'read' && !task.completed
      );
      if (readingTask) {
        completeDailyTask(readingTask.id, sessionWords);
      }
    }
    
    // Show modal - DO NOT call onClose() yet
    setShowSummary(true);
  }, [showSummary, bookId, user?.id, index, startIndex, settings.chunkSize, words, sessionStartTime, library, wpm, onClose, dailyPlan, completeDailyTask, addSessionStats]);

  // Handle exit request (wrapper for handleExitAttempt)
  const handleExitRequest = useCallback(() => {
    handleExitAttempt();
  }, [handleExitAttempt]);

  // Robust Text Cleaner (Fallback - even if DB has dirty text, clean it here)
  const cleanTextForReading = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    
    return text
      // Step 1: Remove null bytes and invisible control characters
      .replace(/\u0000/g, '') // Remove null bytes
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control chars
      
      // Step 2: Fix hyphenation - Merge words split by hyphens (e.g., "pro-\ngram" -> "program")
      .replace(/-\s*\n\s*/g, '') // Remove hyphen + newline (word-\n -> word)
      .replace(/-\s+/g, '') // Remove hyphen + any whitespace (word- word -> wordword)
      .replace(/(\w)-\s*(\w)/g, '$1$2') // Merge hyphenated words on same line (pro-gram -> program)
      
      // Step 3: Normalize line endings
      .replace(/\r\n/g, '\n') // Windows line endings
      .replace(/\r/g, '\n') // Old Mac line endings
      
      // Step 4: Handle newlines (preserve paragraphs, but normalize)
      .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines (paragraphs)
      .replace(/\n/g, ' ') // Convert single newlines to spaces
      .replace(/\s{2,}/g, ' ') // Collapse multiple spaces (including from newlines)
      
      // Step 5: Final whitespace cleanup
      .replace(/\s+/g, ' ') // Collapse any remaining multiple spaces
      .trim(); // Remove leading/trailing whitespace
  };

  // Turkish conjunctions that should not end a chunk
  const TURKISH_CONJUNCTIONS = ['ve', 'ile', 'ki', 'de', 'da', 'dahi', 'ancak', 'fakat', 'ama', 'lakin', 'çünkü', 'zira', 'halbuki', 'oysa', 'oysaki'];

  // Smart Chunking Algorithm (Turkish Optimized) - Refined
  const chunkText = (words: string[], chunkSize: ChunkSize): string[] => {
    if (chunkSize === 1) {
      return words; // No chunking, return as-is
    }

    const chunks: string[] = [];
    let i = 0;

    while (i < words.length) {
      // Determine target chunk size
      let targetSize: number;
      if (chunkSize === 'auto') {
        // Random between 3-4 for variety
        targetSize = Math.random() < 0.5 ? 3 : 4;
      } else {
        targetSize = chunkSize;
      }

      // Build chunk
      const chunkWords: string[] = [];
      let chunkLength = 0;

      while (i < words.length && chunkWords.length < targetSize) {
        const word = words[i];
        const cleanWord = word.replace(/[.,!?;:]/g, '').toLowerCase();
        const wordLength = word.length;

        // Check for sentence-ending punctuation (. ? ! :)
        const endsWithPunctuation = /[.!?:]$/.test(word);
        
        // Check for comma
        const endsWithComma = word.endsWith(',');

        // If word is extremely long (20+ chars), keep it solo
        if (wordLength >= 20 && chunkWords.length > 0) {
          break; // Don't add this word, start new chunk
        }

        // Add word to chunk
        chunkWords.push(word);
        chunkLength += wordLength;
        i++;

        // CRITICAL: Never end chunk with a conjunction - pull next word if available
        if (TURKISH_CONJUNCTIONS.includes(cleanWord) && i < words.length) {
          // Pull the next word into this chunk
          const nextWord = words[i];
          if (nextWord) {
            chunkWords.push(nextWord);
            chunkLength += nextWord.length;
            i++;
          }
        }

        // Break immediately after sentence-ending punctuation (strict)
        if (endsWithPunctuation) {
          break;
        }

        // If we have a comma and chunk is getting long, prefer breaking
        if (endsWithComma && chunkWords.length >= 2 && chunkLength > 15) {
          break;
        }
      }

      // Join chunk words with spaces
      if (chunkWords.length > 0) {
        chunks.push(chunkWords.join(' '));
      }
    }

    return chunks;
  };

  // Adaptive Chunking: Auto-adjust chunk size based on WPM
  const getAdaptiveChunkSize = (currentWpm: number): ChunkSize => {
    if (currentWpm < 400) {
      return 1; // Precision focus - single words
    } else if (currentWpm >= 400 && currentWpm < 800) {
      return 2; // Phrase reading - 2-3 words
    } else {
      return 'auto'; // Scanning mode - 3-4 words or full line
    }
  };

  // Initialize words and start position with robust text normalization
  useEffect(() => {
    // Apply robust cleaning (fallback - even if DB text is dirty, clean it here)
    const normalizedContent = cleanTextForReading(content);

    // Split strictly by spaces (single space after normalization)
    const wordList = normalizedContent
      .split(' ')
      .filter(w => w.length > 0); // Remove empty strings

    // Store original word list for accurate word counting
    setOriginalWords(wordList);

    // Apply chunking based on settings (with adaptive mode support)
    let effectiveChunkSize = settings.chunkSize;
    if (settings.adaptiveMode) {
      effectiveChunkSize = getAdaptiveChunkSize(wpm);
    }
    const chunked = chunkText(wordList, effectiveChunkSize);

    setWords(chunked);
    const startPos = Math.max(0, Math.min(lastPosition || 0, chunked.length - 1));
    setIndex(startPos);
    setStartIndex(startPos);
    setSessionStartTime(Date.now()); // Track when reading session starts
    
    // Show resume toast if resuming from a saved position
    if (lastPosition && lastPosition > 0 && startPos > 0) {
      setShowResumeToast(true);
      setTimeout(() => setShowResumeToast(false), 4000); // Hide after 4 seconds
    }
  }, [content, lastPosition, settings.chunkSize, settings.adaptiveMode]);

  // Re-chunk when WPM changes in adaptive mode
  useEffect(() => {
    if (!settings.adaptiveMode || originalWords.length === 0) return;

    const effectiveChunkSize = getAdaptiveChunkSize(wpm);
    const chunked = chunkText(originalWords, effectiveChunkSize);
    
    // Preserve approximate reading position
    if (words.length > 0 && index < words.length) {
      const ratio = index / words.length;
      const newIndex = Math.floor(ratio * chunked.length);
      setWords(chunked);
      setIndex(Math.min(newIndex, chunked.length - 1));
    } else {
      setWords(chunked);
    }
  }, [wpm, settings.adaptiveMode]);

  // Debounced save progress
  const saveProgressDebounced = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (saveProgressDebounced.current) {
      clearTimeout(saveProgressDebounced.current);
    }
    saveProgressDebounced.current = setTimeout(() => {
      if (!isPlaying && index > 0) {
        saveProgress(index);
      }
    }, 1000); // Save 1 second after pause/change

    return () => {
      if (saveProgressDebounced.current) {
        clearTimeout(saveProgressDebounced.current);
      }
    };
  }, [index, isPlaying, bookId, user?.id]);

  // Focus Audio: Fade in/out based on playing state
  useEffect(() => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    
    // Set initial volume
    if (audio.volume === 1) {
      audio.volume = 0;
    }
    
    const targetVolume = isPlaying && focusAudio !== 'off' ? 0.3 : 0;
    
    // If custom audio URL changed, update the source
    if (focusAudio === 'custom' && customAudioUrl && audio.src !== customAudioUrl) {
      audio.src = customAudioUrl;
      audio.load();
    }
    const volumeStep = 0.05;
    const fadeInterval = 50; // ms
    
    // If audio source changed, reload
    if (focusAudio !== 'off') {
      audio.load();
    }
    
    const fadeTimer = setInterval(() => {
      const currentVolume = audio.volume;
      
      if (Math.abs(currentVolume - targetVolume) < 0.01) {
        audio.volume = targetVolume;
        clearInterval(fadeTimer);
        if (targetVolume === 0) {
          audio.pause();
        } else if (audio.paused && focusAudio !== 'off') {
          audio.play().catch((err) => {
            console.warn('⚠️ [AUDIO] Failed to play focus audio:', err);
          });
        }
        return;
      }
      
      if (currentVolume < targetVolume) {
        audio.volume = Math.min(targetVolume, audio.volume + volumeStep);
      } else {
        audio.volume = Math.max(targetVolume, audio.volume - volumeStep);
      }
    }, fadeInterval);
    
    // Start playing if needed
    if (targetVolume > 0 && audio.paused && focusAudio !== 'off') {
      audio.play().catch((err) => {
        console.warn('⚠️ [AUDIO] Failed to play focus audio:', err);
      });
    }
    
    return () => {
      clearInterval(fadeTimer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.volume = 0;
      }
    };
  }, [isPlaying, focusAudio]);

  // Reading timer - pause when settings are open
  useEffect(() => {
    // CRITICAL: Prevent auto-close for short texts
    if (!isPlaying || words.length === 0) return;
    
    if (isPlaying && !isSettingsOpen) {
      // CRITICAL: Calculate delay accounting for chunk size
      // When chunkSize > 1, we show multiple words per chunk, so delay must be multiplied
      let effectiveChunkSize = settings.chunkSize;
      if (settings.adaptiveMode) {
        effectiveChunkSize = getAdaptiveChunkSize(wpm);
      }
      
      // Convert chunkSize to number for calculation
      const chunkSizeNum = effectiveChunkSize === 'auto' ? 3 : (effectiveChunkSize as number);
      
      // Base delay per word: 60000ms / wpm = ms per word
      // For chunks: delay = (60000 / wpm) * chunkSize
      const baseDelayPerWord = 60000 / wpm;
      const delayPerChunk = baseDelayPerWord * chunkSizeNum;
      
      timerRef.current = setInterval(() => {
        setIndex((prev) => {
          // CRITICAL: Only stop if we've reached the end AND isPlaying is still true
          if (prev >= words.length - 1 && isPlaying) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, delayPerChunk);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, wpm, words.length, isSettingsOpen, settings.chunkSize, settings.adaptiveMode, index]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      // CRITICAL: Trap Escape key - intercept exit attempt
      // Only trap if modal is not already showing
      if (e.key === 'Escape' && !showSummary) {
        e.preventDefault();
        handleExitAttempt();
        return;
      }

      // Don't process other keys if modal is showing
      if (showSummary) {
        return;
      }

      switch (e.key) {
        case ' ': // Spacebar - Toggle play/pause
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'ArrowUp': // Increase WPM
          e.preventDefault();
          handleWpmChange(wpm + 50);
          break;
        case 'ArrowDown': // Decrease WPM
          e.preventDefault();
          handleWpmChange(wpm - 50);
          break;
        case 'ArrowLeft': // Rewind 10 words
          e.preventDefault();
          setIndex(prev => Math.max(0, prev - 10));
          setIsPlaying(false);
          break;
        case 'ArrowRight': // Forward 10 words
          e.preventDefault();
          setIndex(prev => Math.min(words.length - 1, prev + 10));
          setIsPlaying(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [words.length, showSummary, handleExitAttempt]);

  // Legacy handleClose for internal use (when modal confirms exit)
  const handleClose = async () => {
    // This is only called after modal confirms or for very short sessions
    // Calculate words for stats update
    const sessionWords = calculateSessionWords();

    // For sessions with words read, update stats
    if (sessionWords > 0 && user?.id) {
      try {
        await addSessionStats(sessionWords, wpm);
        
        // IMMEDIATELY update daily plan progress - FOR DAILY GOALS SYNC
        const today = new Date().toISOString().split('T')[0];
        if (dailyPlan.date === today) {
          const readingTask = dailyPlan.tasks.find(
            task => task.type === 'read' && !task.completed
          );
          if (readingTask) {
            completeDailyTask(readingTask.id, sessionWords);
          }
        }
        
        // Calculate earned XP for toast display
        const earnedXP = Math.floor(sessionWords / 10);
        
        // Show toast notification with words read
        setWordsRead(sessionWords);
        setXpEarned(earnedXP);
        setShowXpToast(true);

        // Auto-hide toast after 3 seconds
        setTimeout(() => {
          setShowXpToast(false);
          onClose();
        }, 3000);
        return;
      } catch (error) {
        console.error('Failed to update stats:', error);
      }
    }

    // If no words read or no user, close immediately
    onClose();
  };

  // Improved ORP (Optimal Recognition Point) calculation
  // For chunks, center the middle of the chunk in the red focus area
  const getORP = (chunk: string): { before: string; center: string; after: string } => {
    if (!chunk || chunk.length === 0) return { before: '', center: '', after: '' };
    
    // For very short chunks, highlight the whole chunk
    if (chunk.length <= 3) {
      return { before: '', center: chunk, after: '' };
    }

    // For chunks (multiple words), find the center of the entire chunk
    // This helps with optical recognition of the phrase as a whole
    const orpIndex = Math.floor(chunk.length * 0.45); // 45% from start (center of chunk)
    
    return {
      before: chunk.slice(0, orpIndex),
      center: chunk.slice(orpIndex, orpIndex + 1),
      after: chunk.slice(orpIndex + 1),
    };
  };

  // Update settings and persist to localStorage
  const updateSettings = (updates: Partial<RSVPSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Dynamic Font Scaling - Prevents line breaks by scaling based on chunk length
  const getFontSizeClass = (chunk: string, baseSize: FontSize): string => {
    const chunkLength = chunk.length;

    // Base font sizes for each setting
    const baseClasses: Record<FontSize, { short: string; medium: string; long: string }> = {
      small: {
        short: 'text-5xl md:text-6xl',   // < 15 chars
        medium: 'text-3xl md:text-4xl',  // 15-30 chars
        long: 'text-2xl md:text-3xl',    // > 30 chars
      },
      medium: {
        short: 'text-6xl md:text-7xl',    // < 15 chars
        medium: 'text-4xl md:text-5xl',   // 15-30 chars
        long: 'text-3xl md:text-4xl',     // > 30 chars
      },
      large: {
        short: 'text-8xl md:text-9xl',   // < 15 chars
        medium: 'text-6xl md:text-7xl',   // 15-30 chars
        long: 'text-4xl md:text-5xl',     // > 30 chars
      },
      huge: {
        short: 'text-9xl md:text-[12rem]', // < 15 chars
        medium: 'text-7xl md:text-9xl',   // 15-30 chars
        long: 'text-5xl md:text-7xl',     // > 30 chars
      },
    };

    const sizeMap = baseClasses[baseSize];
    
    if (chunkLength < 15) {
      return sizeMap.short;
    } else if (chunkLength <= 30) {
      return sizeMap.medium;
    } else {
      return sizeMap.long;
    }
  };

  // Font family classes
  const fontFamilyClasses: Record<FontFamily, string> = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
  };

  // Get active theme from profile (marketplace themes)
  const profile = useNeuroStore((s) => s.profile);
  const selectedTheme = profile?.selected_theme as 'matrix' | 'paper' | 'cyberpunk' | null;
  
  // Theme color map for inline styles (guarantees override)
  const themeColors: Record<string, string> = {
    matrix: '#000000',
    paper: '#f4ecd8', // Light yellow/sepia
    cyberpunk: '#0b0014', // Deep purple/black
    default: '#09090b',
    dark: '#09090b',
  };

  // Helper function to get theme classes - returns text and font classes only
  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'matrix':
        return {
          text: 'text-[#00ff00]',
          font: 'font-mono',
          shadow: '',
        };
      case 'paper':
        return {
          text: 'text-[#5c4b37]',
          font: 'font-serif',
          shadow: '',
        };
      case 'cyberpunk':
        return {
          text: 'text-[#00f0ff]',
          font: 'font-sans',
          shadow: 'drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]',
        };
      case 'default':
      case 'dark':
      default:
        return {
          text: 'text-white',
          font: 'font-sans',
          shadow: '',
        };
    }
  };

  // Theme classes - includes marketplace themes
  const themeClasses: Record<Theme | 'matrix' | 'paper' | 'cyberpunk', { bg: string; text: string; border: string; bgHex?: string }> = {
    dark: {
      bg: 'bg-black',
      text: 'text-white',
      border: 'border-white/5',
      bgHex: '#000000',
    },
    sepia: {
      bg: '', // Will use inline style for exact color
      bgHex: '#f4ecd8', // Exact Sepia color for reading comfort
      text: 'text-gray-900',
      border: 'border-amber-200',
    },
    matrix: {
      bg: 'bg-black',
      bgHex: '#000000',
      text: 'text-[#00ff00]',
      border: 'border-green-500/20',
    },
    paper: {
      bg: '',
      bgHex: '#fdf6e3',
      text: 'text-[#5c4b37]',
      border: 'border-amber-300',
    },
    cyberpunk: {
      bg: 'bg-[#09090b]',
      bgHex: '#09090b',
      text: 'text-[#00f0ff]',
      border: 'border-cyan-500/20',
    },
  };

  // Determine active theme: profile selected_theme takes priority over settings
  const activeTheme: Theme | 'matrix' | 'paper' | 'cyberpunk' = selectedTheme && ['matrix', 'paper', 'cyberpunk'].includes(selectedTheme)
    ? selectedTheme
    : settings.theme;

  // Get theme classes for the active theme
  const activeThemeClasses = themeClasses[activeTheme] || themeClasses.dark;

  // Handle saving session with comprehension score
  const handleSaveSession = async (comprehensionScore: number) => {
    if (!sessionData || !user?.id) return;

    // CRITICAL: Relaxed validation - allow high-speed reading sessions
    // Only prevent saving if words < 5 (very low)
    if (sessionData.wordsRead < 5) {
      console.warn('⚠️ [SESSION] Session has too few words (< 5), not saving');
      return;
    }

    try {
      // CRITICAL: Clamp WPM to 5000 max before saving
      const clampedWpm = Math.min(5000, sessionData.finalWpm);
      
      // First, update stats (includes XP calculation) - FOR ANALYTICS/CHARTS
      await addSessionStats(sessionData.wordsRead, clampedWpm);

      // IMMEDIATELY update daily plan progress - FOR DAILY GOALS SYNC
      const today = new Date().toISOString().split('T')[0];
      if (dailyPlan.date === today) {
        const readingTask = dailyPlan.tasks.find(
          task => task.type === 'read' && !task.completed
        );
        if (readingTask) {
          completeDailyTask(readingTask.id, sessionData.wordsRead);
        }
      }

      // Then, log reading session to analytics
      const supabase = createClient();
      // @ts-ignore - reading_sessions table may not be in type definitions
      await supabase.from('reading_sessions').insert({
        user_id: user.id,
        book_title: sessionData.bookTitle,
        wpm_speed: clampedWpm, // Use clamped WPM
        duration_seconds: sessionData.durationSeconds,
        words_read: sessionData.wordsRead,
        comprehension_score: comprehensionScore,
      });

      // Show success toast
      const earnedXP = Math.floor(sessionData.wordsRead / 10);
      setWordsRead(sessionData.wordsRead);
      setXpEarned(earnedXP);
      setShowXpToast(true);
    } catch (logError) {
      console.error('Failed to save reading session:', logError);
      throw logError;
    }
  };

  const progress = words.length > 0 ? ((index + 1) / words.length) * 100 : 0;
  const currentWord = words[index] || '';
  const orp = getORP(currentWord);

  // Get theme classes using helper
  const themeClassObj = getThemeClasses(activeTheme);
  // Convert activeTheme to string for lookup, fallback to 'default'
  const themeKey = typeof activeTheme === 'string' ? activeTheme : 'default';
  const backgroundColor = themeColors[themeKey] || themeColors.default;
  
  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center transition-colors",
        themeClassObj.text,
        themeClassObj.font,
        themeClassObj.shadow || ''
      )}
      style={{ backgroundColor }} // Inline style guarantees override - forces background color change
      ref={containerRef}
      onClick={(e) => {
        // Trap backdrop clicks - if clicking outside content area, treat as exit attempt
        if (e.target === e.currentTarget) {
          handleExitAttempt();
        }
      }}
    >
      {/* Resume Toast Notification */}
      {showResumeToast && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[101] animate-fade-in">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-lg flex items-center gap-2">
            <span>📖</span>
            <span>Kaldığınız yerden (Kelime: {index + 1}) devam ediliyor.</span>
          </div>
        </div>
      )}

      {/* Session Complete Toast Notification */}
      {showXpToast && !showSummary && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[101] animate-bounce">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-black px-6 py-3 rounded-full shadow-2xl font-black text-xl flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span>🔥</span>
              <span>Okuma Bitti: {wordsRead} kelime</span>
            </div>
            {xpEarned > 0 && (
              <div className="text-sm">+{xpEarned} XP Kazanıldı!</div>
            )}
          </div>
        </div>
      )}

      {/* Focus Audio Element */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
        style={{ display: 'none' }}
      >
        {focusAudio === 'alpha' && (
          <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" type="audio/mpeg" />
        )}
        {focusAudio === 'rain' && (
          <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" type="audio/mpeg" />
        )}
        {focusAudio === 'white-noise' && (
          <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" type="audio/mpeg" />
        )}
        {focusAudio === 'custom' && customAudioUrl && (
          <source src={customAudioUrl} type="audio/*" />
        )}
      </audio>

      {/* AI Quiz Modal */}
      <AIQuizModal
        isOpen={showQuiz}
        onClose={() => setShowQuiz(false)}
        bookContent={content}
        bookTitle={library.find(b => b.id === bookId)?.title}
      />

      {/* Result Modal - Absolutely positioned with high z-index to prevent unmount */}
      {showSummary && sessionData && (
        <div 
          className="fixed inset-0 z-[101] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            // Prevent backdrop click from closing (only modal buttons can close)
            e.stopPropagation();
          }}
        >
          <ResultModal
            isOpen={showSummary}
            finalWpm={sessionData.finalWpm}
            durationSeconds={sessionData.durationSeconds}
            wordsRead={sessionData.wordsRead}
            onSave={handleSaveSession}
            onCancel={() => {
              // User cancels - just close without saving
              setShowSummary(false);
              handleClose();
            }}
            onClose={() => {
              // User saves - close modal and reader
              setShowSummary(false);
              setShowXpToast(false);
              // Small delay to show toast
              setTimeout(() => {
                handleClose();
              }, 1000);
            }}
          />
        </div>
      )}

      {/* Top Bar */}
      <div className={cn(
        "absolute top-0 w-full p-6 flex justify-between items-center transition-colors",
        (activeTheme === 'dark' || activeTheme === 'matrix' || activeTheme === 'cyberpunk')
          ? "bg-gradient-to-b from-black/80 to-transparent" 
          : "bg-gradient-to-b from-amber-50/80 to-transparent"
      )}>
        <div className={cn("font-mono text-sm", (activeTheme === 'dark' || activeTheme === 'matrix' || activeTheme === 'cyberpunk') ? "text-gray-400" : "text-gray-700")}>
          {settings.chunkSize === 1 
            ? `${index + 1} / ${words.length} Kelime`
            : `${index + 1} / ${words.length} Grup${originalWords.length > 0 ? ` (${originalWords.length} kelime)` : ''}`
          }
          {index > startIndex && (
            <span className="ml-2 text-amber-500">
              (+{settings.chunkSize === 1 
                ? index - startIndex 
                : words.slice(startIndex, index + 1).reduce((count, chunk) => 
                    count + chunk.split(' ').filter(w => w.length > 0).length, 0
                  )
              } bu oturumda)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Fullscreen Toggle */}
          <button 
            onClick={toggleFullscreen} 
            className={cn(
              "p-2 rounded-full transition",
              (activeTheme === 'dark' || activeTheme === 'matrix' || activeTheme === 'cyberpunk') ? "hover:bg-white/10" : "hover:bg-amber-300/50"
            )}
            title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran"}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* AI Quiz Button */}
          <button
            onClick={() => {
              setIsPlaying(false); // Pause reading
              setShowQuiz(true);   // Open AI modal
            }}
            className={cn(
              "p-2 rounded-full transition",
              (activeTheme === 'dark' || activeTheme === 'matrix' || activeTheme === 'cyberpunk') ? "hover:bg-white/10" : "hover:bg-amber-200/50"
            )}
            title="AI Asistanı"
          >
            <BrainCircuit className="w-5 h-5" />
          </button>

          {/* Settings Popover */}
          <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <PopoverTrigger asChild>
              <button 
                className={cn(
                  "p-2 rounded-full transition",
                  (activeTheme === 'dark' || activeTheme === 'matrix' || activeTheme === 'cyberpunk') ? "hover:bg-white/10" : "hover:bg-amber-200/50"
                )}
                title="Ayarlar"
              >
                <Settings className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-zinc-900 border-zinc-700 text-white z-[102]">
              <div className="space-y-4">
                <h3 className="font-bold text-lg mb-4">Okuma Ayarları</h3>
                
                {/* Font Size */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Yazı Boyutu</label>
                  <div className="flex gap-2">
                    {(['small', 'medium', 'large', 'huge'] as FontSize[]).map((size) => (
                      <Button
                        key={size}
                        variant={settings.fontSize === size ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSettings({ fontSize: size })}
                        className={cn(
                          "flex-1 text-xs",
                          settings.fontSize === size && "bg-amber-600 hover:bg-amber-500"
                        )}
                      >
                        {size === 'small' ? 'Küçük' : size === 'medium' ? 'Orta' : size === 'large' ? 'Büyük' : 'Çok Büyük'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Font Family */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Yazı Tipi</label>
                  <div className="flex gap-2">
                    {(['sans', 'serif', 'mono'] as FontFamily[]).map((family) => (
                      <Button
                        key={family}
                        variant={settings.fontFamily === family ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSettings({ fontFamily: family })}
                        className={cn(
                          "flex-1 text-xs",
                          settings.fontFamily === family && "bg-amber-600 hover:bg-amber-500"
                        )}
                      >
                        {family === 'sans' ? 'Sans' : family === 'serif' ? 'Serif' : 'Mono'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Tema</label>
                  <div className="flex gap-2">
                    {(['dark', 'sepia'] as Theme[]).map((themeOption) => (
                      <Button
                        key={themeOption}
                        variant={settings.theme === themeOption ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSettings({ theme: themeOption })}
                        className={cn(
                          "flex-1 text-xs",
                          settings.theme === themeOption && "bg-amber-600 hover:bg-amber-500"
                        )}
                      >
                        {themeOption === 'dark' ? 'Koyu' : themeOption === 'sepia' ? 'Sepia' : themeOption}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Chunk Size (Kelime Grubu) */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Kelime Grubu</label>
                  <div className="grid grid-cols-4 gap-2">
                    {([1, 2, 3, 'auto'] as ChunkSize[]).map((chunkOption) => (
                      <Button
                        key={chunkOption}
                        variant={settings.chunkSize === chunkOption ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSettings({ chunkSize: chunkOption })}
                        disabled={settings.adaptiveMode}
                        className={cn(
                          "text-xs",
                          settings.chunkSize === chunkOption && "bg-amber-600 hover:bg-amber-500",
                          settings.adaptiveMode && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {chunkOption === 'auto' ? 'Otomatik' : chunkOption.toString()}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {settings.adaptiveMode 
                      ? 'Adaptif Mod aktif - Hıza göre otomatik ayarlanıyor'
                      : settings.chunkSize === 1 && 'Tek kelime (Varsayılan)'
                    }
                    {!settings.adaptiveMode && settings.chunkSize === 2 && '2 kelime birlikte'}
                    {!settings.adaptiveMode && settings.chunkSize === 3 && '3 kelime birlikte'}
                    {!settings.adaptiveMode && settings.chunkSize === 'auto' && '3-4 kelime (Akıllı gruplama)'}
                  </p>
                </div>

                {/* Adaptive Mode Toggle */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Adaptif Mod</label>
                  <Button
                    variant={settings.adaptiveMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSettings({ adaptiveMode: !settings.adaptiveMode })}
                    className={cn(
                      "w-full text-xs",
                      settings.adaptiveMode && "bg-amber-600 hover:bg-amber-500"
                    )}
                  >
                    {settings.adaptiveMode ? '✓ Adaptif Mod Açık' : 'Adaptif Mod Kapalı'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    {settings.adaptiveMode 
                      ? 'Hıza göre otomatik ayarlanır: <400 WPM (1 kelime), 400-800 (2-3), >800 (3-4)'
                      : 'Manuel kelime grubu seçimi'
                    }
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Close Button - Uses smart exit logic */}
          <button 
            onClick={handleExitRequest}
            className={cn(
              "p-2 rounded-full transition",
              (activeTheme === 'dark' || activeTheme === 'matrix' || activeTheme === 'cyberpunk') ? "hover:bg-white/10" : "hover:bg-amber-300/50"
            )}
            title="Kapat"
          >
            <X className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Main Reading Area - Centered with Perfect ORP */}
      <div className="flex-1 flex items-center justify-center w-full max-w-4xl px-4">
        <div className="text-center w-full">
          <div 
            className={cn(
              "font-black tracking-tight mb-8 flex items-center justify-center",
              getFontSizeClass(currentWord, settings.fontSize),
              fontFamilyClasses[settings.fontFamily],
              accessibilityMode === 'adhd_focus' && "ring-4 ring-purple-500/50 rounded-lg p-4"
            )}
            style={getModeStyles()}
          >
            {words.length > 0 ? (
              <span 
                className="relative inline-block max-w-[95vw] px-4 whitespace-nowrap" 
                style={{ 
                  lineHeight: accessibilityMode === 'dyslexia' ? 2 : '1.2',
                  ...getModeStyles()
                }}
              >
                {/* Perfectly centered ORP highlighting - optimized for chunks */}
                {/* CRITICAL: whitespace-nowrap prevents line breaks */}
                <span className={settings.theme === 'dark' ? "text-gray-500" : "text-amber-700"}>{orp.before}</span>
                <span className="text-red-500 relative">
                  {orp.center}
                  {/* Visual indicator dot below the red letter */}
                  <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full"></span>
                </span>
                <span className={settings.theme === 'dark' ? "text-gray-500" : "text-amber-700"}>{orp.after}</span>
              </span>
            ) : (
              "Hazır..."
            )}
          </div>
          <div className={cn(
            "w-full h-1 rounded-full mt-12 max-w-md mx-auto overflow-hidden",
            (activeTheme === 'dark' || activeTheme === 'matrix' || activeTheme === 'cyberpunk') ? "bg-gray-800" : "bg-gray-300"
          )}>
            <div className="h-full bg-blue-500 transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className={cn(
        "w-full p-8 border-t transition-colors",
        (activeTheme === 'dark' || activeTheme === 'matrix' || activeTheme === 'cyberpunk')
          ? "bg-[#0a0a0a] border-white/5" 
          : "border-amber-300",
        getControlOpacity()
      )}
      style={(activeTheme === 'sepia' || activeTheme === 'paper' || activeTheme === 'matrix' || activeTheme === 'cyberpunk') && activeThemeClasses.bgHex ? { backgroundColor: activeThemeClasses.bgHex } : undefined}
      >
        <div className="max-w-xl mx-auto flex items-center justify-between">
          {/* WPM Control */}
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl">
            <button 
              onClick={() => handleWpmChange(wpm - 50)} 
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition"
              title="Arrow Down: Decrease speed"
            >
              <ChevronLeft />
            </button>
            <div className="text-center min-w-[80px]">
              <div className="text-xs text-gray-500 font-bold uppercase">HIZ</div>
              <div className="text-xl font-black text-blue-400">{wpm}</div>
            </div>
            <button 
              onClick={() => handleWpmChange(wpm + 50)} 
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition"
              title="Arrow Up: Increase speed (Max: 2000 WPM)"
            >
              <ChevronRight />
            </button>
          </div>

          {/* Focus Audio Control */}
          <Popover open={isAudioMenuOpen} onOpenChange={setIsAudioMenuOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "p-2 hover:bg-white/10 rounded-lg transition",
                  focusAudio !== 'off' ? "text-purple-400" : "text-gray-400"
                )}
                title="Odak Müziği"
              >
                <Music className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-zinc-900 border-zinc-700 text-white p-2">
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setFocusAudio('off');
                    setIsAudioMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md hover:bg-zinc-800 transition",
                    focusAudio === 'off' && "bg-zinc-800 text-purple-400"
                  )}
                >
                  🎵 Sessiz
                </button>
                <button
                  onClick={() => {
                    setFocusAudio('alpha');
                    setIsAudioMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md hover:bg-zinc-800 transition",
                    focusAudio === 'alpha' && "bg-zinc-800 text-purple-400"
                  )}
                >
                  🌊 Alpha Dalgaları
                </button>
                <button
                  onClick={() => {
                    setFocusAudio('rain');
                    setIsAudioMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md hover:bg-zinc-800 transition",
                    focusAudio === 'rain' && "bg-zinc-800 text-purple-400"
                  )}
                >
                  🌧️ Yağmur Sesi
                </button>
                <button
                  onClick={() => {
                    setFocusAudio('white-noise');
                    setIsAudioMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md hover:bg-zinc-800 transition",
                    focusAudio === 'white-noise' && "bg-zinc-800 text-purple-400"
                  )}
                >
                  🔊 Odak Modu (White Noise)
                </button>
                <div className="border-t border-zinc-700 my-1"></div>
                <label className="block">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Validate file type
                        const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/ogg', 'audio/m4a', 'audio/mp4', 'audio/flac', 'audio/x-flac'];
                        const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
                        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
                        
                        if (validTypes.includes(file.type) || validExtensions.includes(fileExtension)) {
                          const url = URL.createObjectURL(file);
                          setCustomAudioUrl(url);
                          setFocusAudio('custom');
                          setIsAudioMenuOpen(false);
                        } else {
                          alert('Desteklenmeyen dosya formatı. Lütfen MP3, WAV, OGG, M4A veya FLAC formatında bir dosya seçin.');
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md hover:bg-zinc-800 transition",
                      focusAudio === 'custom' && "bg-zinc-800 text-purple-400"
                    )}
                  >
                    📁 Kendi Müziğini Yükle
                  </button>
                </label>
                {focusAudio === 'custom' && customAudioUrl && (
                  <p className="text-xs text-zinc-400 px-3 py-1">
                    ✓ Özel müzik yüklendi
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Help Button */}
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-purple-400 transition"
            title="Yardım"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Play/Pause Controls */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setIndex(0); setIsPlaying(false); }} 
              className="p-4 text-gray-500 hover:text-white transition"
              title="Reset to beginning"
            >
              <RotateCcw />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)} 
              className="p-6 bg-white text-black rounded-full hover:scale-105 transition shadow-xl"
              title="Spacebar: Play/Pause"
            >
              {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current ml-1" />}
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="max-w-xl mx-auto mt-4 text-center">
          <p className="text-xs text-gray-600">
            <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-400">Space</kbd> Play/Pause • 
            <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-400 ml-1">↑↓</kbd> Speed • 
            <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-400 ml-1">←→</kbd> Navigate
          </p>
        </div>
      </div>

      <InstructionsModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="Hızlı Okuma Kontrolleri"
        instructions={[
          "Boşluk (Space): Durdur / Başlat",
          "Yukarı/Aşağı Ok: Hızı (WPM) değiştir.",
          "Sağ/Sol Ok: Cümleler arası gezin.",
          "Bakışlarını kelimenin belirdiği orta noktaya kilitle.",
        ]}
      />
    </div>
  );
}
