"use client";

import { Trophy, Flame, CheckCircle2, Circle } from "lucide-react";
import { useNeuroStore } from "@/store/useNeuroStore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getLeague } from "@/lib/league-system";

const XP_PER_LEVEL = 100;

function levelFromXP(xp: number): number {
  return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
}

function progressToNext(xp: number): { current: number; needed: number; pct: number } {
  const inLevel = xp % XP_PER_LEVEL;
  return { current: inLevel, needed: XP_PER_LEVEL, pct: inLevel / XP_PER_LEVEL };
}

// Format number with k suffix (e.g., 12400 -> "12.4k")
function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

export default function UserProgress() {
  const { user } = useNeuroStore();
  const profile = useNeuroStore((s) => (s as Record<string, unknown>).profile) as { xp_points?: number; words_read_today?: number; sessions_completed_today?: number; exercises_completed_today?: number } | undefined;
  const readingStats = useNeuroStore((s) => (s as Record<string, unknown>).readingStats) as { streak?: number; dailyWords?: number } | undefined;
  const { stats } = useNeuroStore();
  const xp = profile?.xp_points ?? stats.xp ?? 0;
  const level = levelFromXP(xp);
  const { current, needed, pct } = progressToNext(xp);
  // Streak: Get from readingStats (real data from DB)
  const streak = readingStats?.streak ?? 0;

  const displayName = user?.name ?? 'Kullanıcı';
  const league = getLeague(xp);

  // Daily Goals - use profile fields from database
  const wordsReadToday = profile?.words_read_today ?? readingStats?.dailyWords ?? 0;
  const sessionsCompletedToday = profile?.sessions_completed_today ?? 0;
  const exercisesCompletedToday = profile?.exercises_completed_today ?? 0;

  // Daily Goals
  const goal1Done = wordsReadToday >= 500;
  const goal2Done = sessionsCompletedToday >= 1;
  const goal3Done = exercisesCompletedToday >= 1;

  return (
    <Card className={cn("overflow-hidden border-white/10 bg-zinc-900/80")}>
      <CardHeader className="pb-2">
        {/* User Name/Email */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white truncate">
              {displayName}
            </p>
            {/* League Badge */}
            <span
              className="text-xs px-2 py-0.5 rounded font-bold border"
              style={{
                backgroundColor: `${league.color}20`,
                color: league.color,
                borderColor: `${league.color}50`,
              }}
            >
              {league.nameTr}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            İlerleme
          </span>
          <div className="flex items-center gap-1.5 text-amber-500">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-bold">Seviye {level}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* XP Bar */}
        <div>
          <div className="mb-1 flex justify-between text-xs text-zinc-500">
            <span>XP</span>
            <span>
              {current} / {needed}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-500"
              style={{ width: `${Math.min(100, pct * 100)}%` }}
            />
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Toplam Okunan</p>
            <p className="text-sm font-bold text-zinc-200">
              {formatNumber(readingStats?.totalWordsRead ?? 0)} Kelime
            </p>
          </div>
          <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">En Yüksek Hız</p>
            <p className="text-sm font-bold text-zinc-200">
              {(readingStats?.highestSpeed ?? 0) > 0 ? `${readingStats.highestSpeed} WPM` : '-'}
            </p>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-2 rounded-lg bg-zinc-800/60 px-3 py-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <div>
            <p className="text-sm font-medium text-zinc-200">{streak} gün</p>
            <p className="text-[10px] text-zinc-500">seri</p>
          </div>
        </div>

        {/* Daily Goals */}
        <div className="space-y-2 pt-2 border-t border-zinc-700/50">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Günlük Hedefler
          </h3>
          <div className="space-y-1.5">
            {/* Goal 1: Read 500 words */}
            <div className={cn(
              "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition",
              goal1Done ? "opacity-60" : "hover:bg-zinc-800/40"
            )}>
              <div className="flex items-center gap-2">
                {goal1Done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-zinc-600 border-2 border-zinc-600" />
                )}
                <span className={cn(
                  "text-xs",
                  goal1Done ? "text-zinc-500 line-through" : "text-zinc-300"
                )}>
                  500 kelime oku
                </span>
              </div>
              {goal1Done ? (
                <span className="text-[10px] text-green-500 font-medium">Tamamlandı</span>
              ) : (
                <span className="text-[10px] text-zinc-500">{wordsReadToday} / 500</span>
              )}
            </div>

            {/* Goal 2: Complete 1 session */}
            <div className={cn(
              "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition",
              goal2Done ? "opacity-60" : "hover:bg-zinc-800/40"
            )}>
              <div className="flex items-center gap-2">
                {goal2Done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-zinc-600 border-2 border-zinc-600" />
                )}
                <span className={cn(
                  "text-xs",
                  goal2Done ? "text-zinc-500 line-through" : "text-zinc-300"
                )}>
                  1 oturum tamamla
                </span>
              </div>
              {goal2Done ? (
                <span className="text-[10px] text-green-500 font-medium">Tamamlandı</span>
              ) : (
                <span className="text-[10px] text-zinc-500">{sessionsCompletedToday} / 1</span>
              )}
            </div>

            {/* Goal 3: Exercise */}
            <div className={cn(
              "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition",
              goal3Done ? "opacity-60" : "hover:bg-zinc-800/40"
            )}>
              <div className="flex items-center gap-2">
                {goal3Done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-zinc-600 border-2 border-zinc-600" />
                )}
                <span className={cn(
                  "text-xs",
                  goal3Done ? "text-zinc-500 line-through" : "text-zinc-300"
                )}>
                  Egzersiz yap
                </span>
              </div>
              {goal3Done ? (
                <span className="text-[10px] text-green-500 font-medium">Tamamlandı</span>
              ) : (
                <span className="text-[10px] text-zinc-500">{exercisesCompletedToday} / 1</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
