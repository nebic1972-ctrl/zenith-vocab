export type RankLevel = 'novice' | 'explorer' | 'analyst' | 'neuro-mind';

export interface RankInfo {
  level: RankLevel;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  minWpm: number;
  maxWpm: number;
  nextLevelWpm?: number;
}

export const RANK_THRESHOLDS: Record<RankLevel, RankInfo> = {
  novice: {
    level: 'novice',
    name: 'Çırak',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    minWpm: 0,
    maxWpm: 200,
    nextLevelWpm: 201,
  },
  explorer: {
    level: 'explorer',
    name: 'Gezgin',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    minWpm: 201,
    maxWpm: 400,
    nextLevelWpm: 401,
  },
  analyst: {
    level: 'analyst',
    name: 'Analist',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    minWpm: 401,
    maxWpm: 700,
    nextLevelWpm: 701,
  },
  'neuro-mind': {
    level: 'neuro-mind',
    name: 'Nöro-Zihin',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    minWpm: 701,
    maxWpm: Infinity,
  },
};

export function calculateRank(wpm: number): RankInfo {
  if (wpm >= 701) {
    return RANK_THRESHOLDS['neuro-mind'];
  } else if (wpm >= 401) {
    return RANK_THRESHOLDS.analyst;
  } else if (wpm >= 201) {
    return RANK_THRESHOLDS.explorer;
  } else {
    return RANK_THRESHOLDS.novice;
  }
}

export function getMotivationalMessage(rank: RankInfo, wpm: number): string {
  switch (rank.level) {
    case 'novice':
      return 'Başlangıç yolculuğunda ilk adımları atıyorsun!';
    case 'explorer':
      return 'Beynin %20 daha hızlı işlemeye başladı!';
    case 'analyst':
      return 'Mükemmel! Zihinsel kapasiteni artırıyorsun.';
    case 'neuro-mind':
      return 'Harika! Nöro-plastisite seviyesinde okuyorsun! 🚀';
    default:
      return 'Harika bir performans gösterdin!';
  }
}

export function calculateProgressToNextRank(wpm: number, rank: RankInfo): number {
  if (rank.nextLevelWpm === undefined) {
    return 100; // Max level reached
  }
  
  const currentRange = rank.maxWpm - rank.minWpm;
  const progressInRange = wpm - rank.minWpm;
  const progressPercentage = (progressInRange / currentRange) * 100;
  
  return Math.min(100, Math.max(0, progressPercentage));
}
