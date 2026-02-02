"use client";

import { useState, useEffect } from "react";
import { useNeuroStore } from "@/store/useNeuroStore";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Trophy, Crown, Medal, Award } from "lucide-react";
import { getLeague } from "@/lib/league-system";

interface LeaderboardUser {
  id: string;
  user_id: string;
  xp_points: number;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  current_level?: number | null;
  total_words_read?: number;
  highest_speed?: number;
}

const XP_PER_LEVEL = 100;

function levelFromXP(xp: number): number {
  return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
}

export default function Leaderboard() {
  const { user: currentUser } = useNeuroStore();
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userMap, setUserMap] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      // Simplified query - only essential columns to avoid RLS/type issues
      // @ts-ignore - profiles table may not be in type definitions
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, xp_points, current_level, full_name')
        .order('xp_points', { ascending: false })
        .limit(20);

      if (error) {
        // Detailed error logging
        console.error('🔴 [LEADERBOARD] Error fetching leaderboard:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          status: error.status,
          statusText: error.statusText,
        });
        setIsLoading(false);
        return;
      }

      console.log('✅ [LEADERBOARD] Fetched', data?.length || 0, 'users');
      setLeaders((data as LeaderboardUser[]) || []);
    } catch (error) {
      console.error('🔴 [LEADERBOARD] Exception during fetch:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get rank icon based on position
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return null;
  };

  // Get rank badge color
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    if (rank === 2) return "bg-gray-400/20 text-gray-300 border-gray-400/30";
    if (rank === 3) return "bg-amber-600/20 text-amber-400 border-amber-600/30";
    return "bg-zinc-700/50 text-zinc-400 border-zinc-700";
  };

  // Get display name from profile data with proper fallbacks
  const getDisplayName = (leader: LeaderboardUser): string => {
    // Priority 1: full_name from profile
    if (leader.full_name && leader.full_name.trim().length > 0) {
      return leader.full_name;
    }
    
    // Priority 2: email (extract part before @) with "Kullanıcı" prefix
    if (leader.email && typeof leader.email === 'string' && leader.email.includes('@')) {
      const emailPart = leader.email.split('@')[0];
      return `Kullanıcı ${emailPart.slice(0, 8)}`; // First 8 chars of email
    }
    
    // Priority 3: Fallback
    return 'Kullanıcı';
  };

  // Get avatar initials from name
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
          <p className="text-sm text-zinc-500">Sıralama yükleniyor...</p>
        </div>
      </div>
    );
  }

  // If no leaders found, create a single entry for current user if they exist
  const displayLeaders = leaders.length > 0 
    ? leaders 
    : (currentUser ? [{
        id: currentUser.id,
        user_id: currentUser.id,
        xp_points: 0,
        full_name: currentUser.name || null,
        email: currentUser.email || null,
        avatar_url: currentUser.avatar || null,
        current_level: null,
      } as LeaderboardUser] : []);
  
  const showChampionMessage = leaders.length === 0 && currentUser;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-white bg-clip-text text-transparent">
          Sıralama
        </h2>
        <p className="text-zinc-500 text-sm mt-1">
          En çok XP kazanan okuyucular. Sen neredesin?
        </p>
      </div>

      <Card className={cn("overflow-hidden border-white/10 bg-zinc-900/80")}>
        <CardHeader>
          <h3 className="text-lg font-semibold">Liderlik Tablosu</h3>
          <p className="text-sm text-zinc-500">Top 20 okuyucu</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Champion Message (if only 1 user) */}
            {showChampionMessage && (
              <div className="mb-6 flex flex-col items-center justify-center py-6 space-y-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30">
                <div className="p-3 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-2 border-purple-500/50">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </div>
                <h4 className="text-xl font-bold text-white">Sen Lidersin! 🎉</h4>
                <p className="text-sm text-zinc-400">Henüz başka kullanıcı yok. İlk sen ol!</p>
              </div>
            )}

            {/* Leaderboard List - Always show, even with 1 user */}
            {displayLeaders.map((leader, index) => {
              const rank = index + 1;
              const level = leader.current_level || levelFromXP(leader.xp_points);
              const isCurrentUser = leader.id === currentUser?.id;
              
              // Get display name using proper fallback logic
              const displayName = getDisplayName(leader);
              const initials = getInitials(displayName);
              
              // Get avatar - prefer avatar_url from profile, fallback to initials
              const avatarUrl = leader.avatar_url || (isCurrentUser ? currentUser?.avatar : null);

              return (
                <div
                  key={leader.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border transition-all",
                    isCurrentUser
                      ? "bg-purple-500/10 border-purple-500 shadow-lg shadow-purple-500/20"
                      : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800/70"
                  )}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12 shrink-0">
                    {getRankIcon(rank) || (
                      <span className={cn(
                        "text-lg font-bold px-2 py-1 rounded border",
                        getRankBadgeColor(rank)
                      )}>
                        #{rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className={cn(
                          "h-10 w-10 rounded-full object-cover border-2",
                          isCurrentUser ? "border-purple-500" : "border-zinc-700"
                        )}
                      />
                    ) : (
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border-2",
                        isCurrentUser
                          ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white border-purple-500"
                          : "bg-zinc-700 text-zinc-300 border-zinc-700"
                      )}>
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "font-semibold truncate",
                        isCurrentUser ? "text-white" : "text-zinc-200"
                      )}>
                        {isCurrentUser ? (currentUser?.name ?? 'Kullanıcı') : displayName}
                      </p>
                      {isCurrentUser && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/30 text-purple-300 border border-purple-500/50">
                          Sen
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded border",
                        getRankBadgeColor(rank)
                      )}>
                        Seviye {level}
                      </span>
                      {/* League Badge */}
                      {(() => {
                        const league = getLeague(leader.xp_points);
                        return (
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
                        );
                      })()}
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-amber-400">
                      {leader.xp_points.toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-500">XP</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current User Not in Top 20 Message */}
          {currentUser && leaders.length > 0 && !leaders.find(l => l.id === currentUser.id) && (
            <div className="mt-4 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 text-center">
              <p className="text-sm text-zinc-400">
                Sen henüz ilk 20'de değilsin. Daha fazla okuyarak yüksel! 💪
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
