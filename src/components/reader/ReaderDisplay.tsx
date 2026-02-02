'use client';

import { useMemo } from 'react';
import { safeIntentDetection, type SafeTone } from '@/lib/toneAnalyzer';

const TONE_STYLE: Record<SafeTone, string> = {
  HighTension: 'border-b-2 border-orange-500 text-orange-100',
  Ambiguous: 'text-purple-300 italic',
  Neutral: 'text-white',
  Positive: 'text-white',
};

export interface ReaderDisplayProps {
  chunk: string;
  bionic: boolean;
  theme: 'dark' | 'light' | 'sepia';
  fontSizeClass: string;
  chunkKey: string;
  isZen?: boolean;
}

function renderBionicWord(word: string, theme: 'dark' | 'light' | 'sepia') {
  const length = word.length;
  const fixPoint =
    length <= 1 ? 1 : length <= 3 ? 1 : length <= 6 ? 2 : length <= 10 ? 3 : 4;
  const boldPart = word.slice(0, fixPoint);
  const normalPart = word.slice(fixPoint);
  const base = theme === 'light' ? 'text-black' : 'text-white';
  return (
    <span className="inline-block">
      <span className={`font-bold ${base}`}>{boldPart}</span>
      <span className="font-normal opacity-75">{normalPart}</span>
    </span>
  );
}

export default function ReaderDisplay({
  chunk,
  bionic,
  theme,
  fontSizeClass,
  chunkKey,
  isZen = false,
}: ReaderDisplayProps) {
  const { tone } = useMemo(() => safeIntentDetection(chunk), [chunk]);
  const styleClass = TONE_STYLE[tone];
  const showBadge = tone === 'HighTension' || tone === 'Ambiguous';
  const neutralDefault = isZen
    ? 'text-gray-500'
    : theme === 'light'
      ? 'text-gray-900'
      : 'text-white';
  const effectiveClass =
    tone === 'Neutral' || tone === 'Positive' ? neutralDefault : styleClass;

  if (!chunk) {
    return (
      <h1
        className={`${fontSizeClass} font-serif tracking-tight text-center leading-relaxed select-none transition-colors duration-1000 ${
          isZen
            ? 'text-gray-500 selection:bg-gray-800 selection:text-gray-300'
            : 'text-white'
        }`}
      >
        {isZen ? '—' : renderBionicWord('—', theme)}
      </h1>
    );
  }

  const parts = chunk.split(' ').filter(Boolean);

  return (
    <>
      {isZen && (
        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-60 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"
          aria-hidden
        />
      )}
      <h1
        className={`${fontSizeClass} font-serif tracking-tight text-center leading-relaxed z-10 select-none transition-colors duration-1000 ${
          isZen
            ? 'text-gray-500 selection:bg-gray-800 selection:text-gray-300'
            : 'text-white'
        }`}
      >
        <div
          className={`relative inline-block font-bold transition-colors duration-300 ${
            showBadge ? 'pt-10' : ''
          } ${effectiveClass}`}
        >
          {showBadge && (
            <span
              className="absolute top-0 left-1/2 -translate-x-1/2 text-xs uppercase tracking-widest font-bold px-2 py-1 rounded bg-white/10 whitespace-nowrap"
              aria-label={tone}
            >
              {tone === 'HighTension'
                ? '⚠️ Dikkat et'
                : '🎭 Burada bir bit yeniği olabilir'}
            </span>
          )}
          {showBadge ? (
            <span>
              {parts.map((w, i) => (
                <span key={`${chunkKey}-${i}`}>
                  {i > 0 && ' '}
                  {w}
                </span>
              ))}
            </span>
          ) : (
            <span
              className={`transition-colors duration-1000 ${
                isZen
                  ? 'text-gray-500 selection:bg-gray-800 selection:text-gray-300'
                  : 'text-white'
              }`}
            >
              {parts.map((w, i) => (
                <span key={`${chunkKey}-${i}`}>
                  {i > 0 && ' '}
                  {bionic ? renderBionicWord(w, theme) : w}
                </span>
              ))}
            </span>
          )}
        </div>
      </h1>
    </>
  );
}
