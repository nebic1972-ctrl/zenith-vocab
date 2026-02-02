"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useNeuroStore } from "@/store/useNeuroStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  X,
  Settings2,
  Crosshair,
  Type,
  Brain,
  Move,
  Eye,
  Target,
  ArrowLeft,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SelectionFlashcardButton } from "@/features/learning/components/SelectionFlashcardButton";
import { getReadingProgress, saveReadingProgress } from "@/features/learning/actions/reading-progress";

// ORP (Optimal Recognition Point): kelimenin ortasındaki harfi vurgular
function RenderORP({
  word,
  active,
}: {
  word: string;
  active: boolean;
}) {
  if (!active || word.length < 2) {
    return <span className="text-white">{word}</span>;
  }
  const centerIndex = Math.floor(word.length / 2);
  const start = word.slice(0, centerIndex);
  const pivot = word[centerIndex];
  const end = word.slice(centerIndex + 1);
  return (
    <span className="inline-block mx-1">
      <span className="text-slate-200">{start}</span>
      <span className="text-red-500 font-bold scale-110 inline-block">
        {pivot}
      </span>
      <span className="text-slate-200">{end}</span>
    </span>
  );
}

const genesisText = `NeuroRead sistemine hoş geldiniz. Lütfen kütüphaneden bir kitap seçin.`.split(
  /\s+/
);

const READER_PREFS_KEY = "neuro-reader-prefs";

function ReaderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    wpm,
    chunkSize,
    isZenMode,
    setWpm,
    setChunkSize,
    toggleZenMode,
    xp,
    level,
    addXP,
    syncProfile,
  } = useNeuroStore();

  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  const [readerMode, setReaderMode] = useState<"normal" | "adhd" | "dyslexia">(
    "normal"
  );
  const [isORPActive, setIsORPActive] = useState(true);
  const [isEyeExerciseActive, setIsEyeExerciseActive] = useState(false);
  const [eyeExercisePhase, setEyeExercisePhase] = useState(0);

  const prevIndexRef = useRef(0);
  const hasToastedEndRef = useRef(false);
  const hasBonusRef = useRef(false);
  const eyeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(0);
  currentIndexRef.current = currentIndex;

  // Tercihleri localStorage'dan oku (sistemle çakışmaz)
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" && window.localStorage.getItem(READER_PREFS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { readerMode?: string; isORPActive?: boolean };
        if (parsed.readerMode === "normal" || parsed.readerMode === "adhd" || parsed.readerMode === "dyslexia") {
          setReaderMode(parsed.readerMode);
        }
        if (typeof parsed.isORPActive === "boolean") setIsORPActive(parsed.isORPActive);
      }
    } catch {
      // Geçersiz JSON veya erişim yoksa varsayılanlarda kal
    }
  }, []);

  // Tercihler değişince localStorage'a yaz
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          READER_PREFS_KEY,
          JSON.stringify({ readerMode, isORPActive })
        );
      }
    } catch {
      // localStorage dolu vs.
    }
  }, [readerMode, isORPActive]);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      await syncProfile();
      const bookId = searchParams.get("bookId");
      if (bookId) {
        const supabase = createClient();
        const { data: book } = await supabase
          .from("library")
          .select("content_text")
          .eq("id", bookId)
          .single();
        const wordArray = book?.content_text ? book.content_text.split(/\s+/) : [...genesisText];
        setWords(wordArray);
        const { success, position } = await getReadingProgress(bookId);
        if (success && position != null) {
          setCurrentIndex(Math.min(Math.max(0, position), wordArray.length));
        }
      } else {
        setWords(genesisText);
        setCurrentIndex(0);
      }
      setLoading(false);
    };
    loadContent();
  }, [searchParams, syncProfile]);

  // Okuma ilerlemesini kaydet (debounce 2s) ve sayfadan çıkarken kaydet
  useEffect(() => {
    const bookId = searchParams.get("bookId");
    if (!bookId || words.length === 0) return;

    const save = (position: number) => {
      saveReadingProgress(bookId, position).catch(() => {});
    };

    if (progressSaveTimeoutRef.current) {
      clearTimeout(progressSaveTimeoutRef.current);
      progressSaveTimeoutRef.current = null;
    }
    progressSaveTimeoutRef.current = setTimeout(() => {
      save(currentIndex);
      progressSaveTimeoutRef.current = null;
    }, 2000);

    return () => {
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current);
        progressSaveTimeoutRef.current = null;
      }
      save(currentIndexRef.current);
    };
  }, [currentIndex, searchParams, words.length]);

  // Klavye: Space = play/pause, Escape = zen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (e.key === " ") {
        if (words.length === 0 || inInput) return;
        e.preventDefault();
        setIsPlaying((prev) => !prev);
        return;
      }
      if (e.key === "Escape" && !inInput) {
        e.preventDefault();
        toggleZenMode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [words.length, toggleZenMode]);

  const calculateDelay = useCallback((word: string, baseWpm: number) => {
    const baseDelay = 60000 / baseWpm;
    let multiplier = 1;
    if (word.match(/[.!?;:]$/)) multiplier = 2.5;
    else if (word.match(/[,()"]$/)) multiplier = 1.5;
    if (word.length > 12) multiplier += 0.5;
    else if (word.length < 3) multiplier -= 0.1;
    return baseDelay * multiplier;
  }, []);

  // Okuma motoru: sadece index ilerletir (XP ayrı effect'te)
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (
      isPlaying &&
      currentIndex < words.length &&
      !isEyeExerciseActive
    ) {
      const currentWord = words[currentIndex] ?? "";
      const delay = calculateDelay(currentWord, wpm);

      interval = setTimeout(() => {
        const nextIndex = currentIndex + chunkSize;
        if (nextIndex <= words.length) setCurrentIndex(nextIndex);
      }, delay);
    } else if (currentIndex >= words.length && words.length > 0) {
      setIsPlaying(false);
    }

    return () => {
      if (interval !== undefined) clearTimeout(interval);
    };
  }, [
    isPlaying,
    currentIndex,
    wpm,
    chunkSize,
    words.length,
    isEyeExerciseActive,
    calculateDelay,
  ]);

  // XP: sadece effect içinde (mimariyle çakışmaz); kitap bitişi bonusu tek sefer
  useEffect(() => {
    if (isPlaying && currentIndex > prevIndexRef.current) {
      addXP(chunkSize);
    }
    if (
      currentIndex >= words.length &&
      words.length > 0
    ) {
      if (!hasBonusRef.current) {
        hasBonusRef.current = true;
        addXP(500);
      }
      if (!hasToastedEndRef.current) {
        hasToastedEndRef.current = true;
        toast.success("Kitap Bitti! 📚", {
          description: "+500 XP Bonus kazanıldı!",
        });
      }
    }
    prevIndexRef.current = currentIndex;
  }, [currentIndex, isPlaying, chunkSize, addXP, words.length]);

  useEffect(() => {
    if (currentIndex === 0) {
      hasToastedEndRef.current = false;
      hasBonusRef.current = false;
    }
  }, [currentIndex]);

  // Göz egzersizi: 10 saniye sonra bitir
  useEffect(() => {
    if (eyeExercisePhase >= 10 && eyeIntervalRef.current) {
      clearInterval(eyeIntervalRef.current);
      eyeIntervalRef.current = null;
      setIsEyeExerciseActive(false);
      setEyeExercisePhase(0);
      setIsPlaying(true);
      toast.success("Gözler ısındı! Okuma başlıyor.");
    }
  }, [eyeExercisePhase]);

  useEffect(() => {
    return () => {
      if (eyeIntervalRef.current) {
        clearInterval(eyeIntervalRef.current);
        eyeIntervalRef.current = null;
      }
    };
  }, []);

  const startEyeExercise = useCallback(() => {
    setIsPlaying(false);
    setIsEyeExerciseActive(true);
    setEyeExercisePhase(0);
    eyeIntervalRef.current = setInterval(
      () => setEyeExercisePhase((p) => p + 1),
      1000
    );
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
      if (e.code === "ArrowRight") {
        setCurrentIndex((p) => Math.min(p + 10, words.length));
      }
      if (e.code === "ArrowLeft") {
        setCurrentIndex((p) => Math.max(0, p - 10));
      }
      if (e.code === "Escape") {
        if (isZenMode) {
          toggleZenMode();
          toast("Zen Modu Kapalı", {
            description: "Standart görünüme dönüldü.",
          });
        } else {
          router.back();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [words.length, isZenMode, toggleZenMode, router]);

  const getContainerStyles = () => {
    if (readerMode === "dyslexia")
      return "bg-[#fdf6e3] text-slate-900 font-sans tracking-wide leading-loose";
    if (readerMode === "adhd") return "bg-black text-white";
    if (isZenMode) return "bg-black text-white";
    return "bg-slate-950 text-slate-100";
  };

  const progressPct =
    words.length > 0 ? (currentIndex / words.length) * 100 : 0;
  const xpBarPct = (xp % 1000) / 10;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-blue-500 animate-pulse">
        Sistem Hazırlanıyor...
      </div>
    );
  }

  return (
    <div
      className={`relative flex min-h-screen flex-col overflow-hidden transition-colors duration-700 ${getContainerStyles()}`}
    >
      {/* Zen modu güvenlik çıkışı (sol üst hover) */}
      {isZenMode && (
        <div className="fixed top-0 left-0 p-4 z-50 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/library")}
            className="bg-white/10 backdrop-blur text-white hover:bg-white/20"
            aria-label="Kütüphaneye dön"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Çıkış
          </Button>
        </div>
      )}

      {/* Arka plan (Normal + Lava) */}
      {readerMode === "normal" && !isZenMode && (
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
          <div
            className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/40 rounded-full blur-[120px] mix-blend-multiply animate-blob"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/40 rounded-full blur-[120px] mix-blend-multiply animate-blob"
            style={{ animationDelay: "4s" }}
          />
        </div>
      )}

      {/* Göz egzersizi katmanı */}
      {isEyeExerciseActive && (
        <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center">
          <div className="text-white mb-8 text-2xl font-mono">
            Göz Kaslarını Isıt... {10 - eyeExercisePhase}
          </div>
          <div className="relative w-full h-64">
            <div
              className={`absolute w-8 h-8 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.8)] transition-all duration-1000 ease-in-out
                ${eyeExercisePhase % 2 === 0 ? "left-[10%]" : "left-[90%]"}
                ${eyeExercisePhase % 3 === 0 ? "top-[10%]" : "top-[50%]"}
              `}
            />
          </div>
          <p className="text-slate-500 mt-4">
            Topu sadece gözlerinle takip et (Başını oynatma).
          </p>
        </div>
      )}

      {/* Üst HUD */}
      {!isZenMode && !isEyeExerciseActive && (
        <div className="fixed top-0 left-0 right-0 z-40 p-4 flex justify-between items-start">
          <div className="bg-slate-900/50 backdrop-blur-md p-2 pr-4 rounded-full border border-white/10 flex items-center gap-3 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
              {level}
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">
                Neuro Level
              </div>
              <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${xpBarPct}%` }}
                />
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-full transition-colors"
            onClick={() => router.push("/library")}
            aria-label="Kütüphaneye dön"
          >
            <X size={24} />
          </Button>
        </div>
      )}

      {/* Ana okuma alanı */}
      <main className="relative flex-1 flex flex-col items-center justify-center p-4 z-10">
        <div className="relative w-full max-w-5xl h-[50vh] flex items-center justify-center">
          <div className="relative z-20 text-center select-none">
            <div
              className={`
                transition-all duration-150 flex items-center justify-center gap-4 flex-wrap
                ${readerMode === "dyslexia" ? "text-6xl font-sans tracking-widest text-slate-900" : "text-6xl md:text-8xl font-bold text-white"}
                ${readerMode === "adhd" ? "opacity-100 scale-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" : ""}
              `}
            >
              {words
                .slice(currentIndex, currentIndex + chunkSize)
                .map((word, idx) => (
                  <RenderORP
                    key={`${currentIndex}-${idx}`}
                    word={word}
                    active={isORPActive && chunkSize === 1}
                  />
                ))}
            </div>
            {!isZenMode && words.length > 0 && (
              <div className="mt-12 flex flex-col items-center gap-2">
                <div className="w-48 h-1.5 bg-slate-800/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500/70 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 tabular-nums" aria-live="polite">
                  {currentIndex} / {words.length} kelime
                </span>
              </div>
            )}
          </div>

          {!isZenMode && readerMode !== "dyslexia" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              <div className="w-[80%] h-[1px] bg-red-500" />
              <div className="h-[60%] w-[1px] bg-red-500 absolute" />
            </div>
          )}

          {(readerMode === "adhd" || isZenMode) && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,black_100%)] pointer-events-none duration-500" />
          )}
        </div>
      </main>

      {/* Kontrol dock */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${isZenMode ? "translate-y-40 opacity-0 hover:translate-y-0 hover:opacity-100" : "translate-y-0 opacity-100"}`}
      >
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-2xl border border-white/10 px-4 py-3 rounded-2xl shadow-2xl">
          <Button
            size="icon"
            className={`w-12 h-12 rounded-xl shadow-lg ${isPlaying ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"}`}
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? "Duraklat" : "Oynat"}
          >
            {isPlaying ? (
              <Pause fill="white" />
            ) : (
              <Play fill="white" className="ml-1" />
            )}
          </Button>

          <div className="w-[1px] h-8 bg-white/10 mx-2" />

          {/* --- AI FLASHCARD BUTONU --- */}
          <SelectionFlashcardButton
            word={words[currentIndex] ?? ""}
            // Kelimenin öncesindeki ve sonrasındaki 5 kelimeyi bağlam olarak al
            context={words.slice(Math.max(0, currentIndex - 5), currentIndex + 6).join(" ")}
            bookId={searchParams.get("bookId") ?? undefined}
            compact={true}
            variant="ghost"
          />

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`text-slate-300 hover:text-white hover:bg-white/10 rounded-lg ${readerMode !== "normal" ? "text-blue-400" : ""}`}
                title="Okuma Modları"
                aria-label="Okuma modları (Normal, ADHD, Disleksi)"
              >
                <Brain size={20} />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-60 bg-slate-900 border-slate-800 p-2 rounded-xl text-slate-200"
              align="center"
              side="top"
            >
              <div className="grid gap-1">
                <p className="text-xs text-slate-500 font-bold px-2 py-1 uppercase">
                  Nöro Modlar
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => setReaderMode("normal")}
                >
                  <Zap size={14} className="mr-2" /> Normal (Lava)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => setReaderMode("adhd")}
                >
                  <Target size={14} className="mr-2 text-red-400" /> ADHD (Hiper
                  Odak)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => setReaderMode("dyslexia")}
                >
                  <Type size={14} className="mr-2 text-yellow-400" /> Disleksi
                  Dostu
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-300 hover:text-white hover:bg-white/10 rounded-lg"
                aria-label="Hız ve okuma ayarları"
              >
                <Settings2 size={20} />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-72 bg-slate-900 border-slate-800 p-4 rounded-xl space-y-4"
              align="center"
              side="top"
            >
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm text-slate-300">
                    Hız (WPM):{" "}
                    <span className="text-blue-400 font-bold">{wpm}</span>
                  </label>
                </div>
                <Slider
                  value={[wpm]}
                  min={100}
                  max={1000}
                  step={25}
                  onValueChange={(v) => setWpm(v[0] ?? wpm)}
                />
                <div className="flex items-center justify-between pt-2">
                  <label className="text-sm text-slate-300 flex items-center gap-2">
                    <Crosshair size={14} /> Kırmızı Odak (ORP)
                  </label>
                  <Button
                    variant={isORPActive ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setIsORPActive(!isORPActive)}
                    className="text-xs"
                  >
                    {isORPActive ? "Açık" : "Kapalı"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-300 flex items-center gap-2">
                    <Move size={14} /> Kelime Grubu: {chunkSize}
                  </label>
                  <Slider
                    value={[chunkSize]}
                    min={1}
                    max={5}
                    step={1}
                    className="w-20"
                    onValueChange={(v) => setChunkSize(v[0] ?? chunkSize)}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={startEyeExercise}
            className="text-slate-300 hover:text-white hover:bg-white/10 rounded-lg"
            title="Göz Isınma"
            aria-label="Göz ısınma egzersizi başlat"
          >
            <Eye size={20} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleZenMode}
            className={`rounded-lg ${isZenMode ? "text-yellow-400" : "text-slate-300 hover:text-white"}`}
            title="Zen Modu"
            aria-label={isZenMode ? "Zen modundan çık" : "Zen modu (dikkat odaklı)"}
          >
            <Zap size={20} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              setCurrentIndex(0);
              setIsPlaying(false);
              const bookId = searchParams.get("bookId");
              if (bookId) {
                const { success } = await saveReadingProgress(bookId, 0);
                if (success) toast("Baştan oku", { description: "İlerleme sıfırlandı." });
              }
            }}
            className="text-slate-300 hover:text-white hover:bg-white/10 rounded-lg"
            title="Baştan oku"
            aria-label="Baştan oku (ilerleme sıfırlanır)"
          >
            <RotateCcw size={20} />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-300 hover:text-white hover:bg-white/10 rounded-lg"
                title="Klavye kısayolları"
                aria-label="Klavye kısayolları yardımı"
              >
                <HelpCircle size={20} />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 bg-slate-900 border-slate-800 p-3 rounded-xl text-slate-200 text-sm"
              align="center"
              side="top"
            >
              <p className="font-bold text-slate-300 mb-2">Klavye kısayolları</p>
              <ul className="space-y-1.5 text-xs">
                <li><kbd className="bg-slate-800 px-1.5 py-0.5 rounded">Space</kbd> Oynat / Duraklat</li>
                <li><kbd className="bg-slate-800 px-1.5 py-0.5 rounded">Esc</kbd> Zen modu aç/kapa</li>
                <li><kbd className="bg-slate-800 px-1.5 py-0.5 rounded">←</kbd> 10 kelime geri</li>
                <li><kbd className="bg-slate-800 px-1.5 py-0.5 rounded">→</kbd> 10 kelime ileri</li>
              </ul>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/library")}
            className="text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
            aria-label="Çıkış"
          >
            <ArrowLeft size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ReaderPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300 p-10 text-center">
          Motor Hazırlanıyor...
        </div>
      }
    >
      <ReaderPage />
    </Suspense>
  );
}
