/**
 * League System - Determines user's league based on XP
 */

export type League = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface LeagueInfo {
  name: string;
  nameTr: string;
  color: string;
  minXP: number;
  maxXP: number | null; // null means no upper limit
}

export const LEAGUES: Record<League, LeagueInfo> = {
  bronze: {
    name: 'Bronze',
    nameTr: 'Bronz',
    color: '#cd7f32',
    minXP: 0,
    maxXP: 2000,
  },
  silver: {
    name: 'Silver',
    nameTr: 'Gümüş',
    color: '#c0c0c0',
    minXP: 2000,
    maxXP: 10000,
  },
  gold: {
    name: 'Gold',
    nameTr: 'Altın',
    color: '#ffd700',
    minXP: 10000,
    maxXP: 25000,
  },
  diamond: {
    name: 'Diamond',
    nameTr: 'Elmas',
    color: '#b9f2ff',
    minXP: 25000,
    maxXP: null,
  },
};

/**
 * Get league information based on XP
 */
export function getLeague(xp: number): LeagueInfo {
  const xpValue = Math.max(0, xp);
  
  // Check from highest to lowest
  if (xpValue >= LEAGUES.diamond.minXP) {
    return LEAGUES.diamond;
  }
  if (xpValue >= LEAGUES.gold.minXP) {
    return LEAGUES.gold;
  }
  if (xpValue >= LEAGUES.silver.minXP) {
    return LEAGUES.silver;
  }
  return LEAGUES.bronze;
}

/**
 * Get progress to next league (0-1)
 */
export function getLeagueProgress(xp: number): { current: number; next: LeagueInfo | null; progress: number } {
  const currentLeague = getLeague(xp);
  const leagueList: League[] = ['bronze', 'silver', 'gold', 'diamond'];
  const currentIndex = leagueList.indexOf(currentLeague.name.toLowerCase() as League);
  
  if (currentIndex === leagueList.length - 1) {
    // Already at highest league
    return { current: xp, next: null, progress: 1 };
  }
  
  const nextLeague = LEAGUES[leagueList[currentIndex + 1]];
  const range = nextLeague.minXP - currentLeague.minXP;
  const progress = range > 0 ? (xp - currentLeague.minXP) / range : 0;
  
  return {
    current: xp,
    next: nextLeague,
    progress: Math.min(1, Math.max(0, progress)),
  };
}
