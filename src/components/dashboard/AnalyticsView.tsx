"use client";

import { useState, useEffect } from "react";
import { useNeuroStore } from "@/store/useNeuroStore";
import { createClient } from "@/lib/supabase/client";
import { useNeuroStore } from "@/store/useNeuroStore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDateForChart } from "@/lib/date-utils";
import { BookOpen, Clock, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ReadingSession {
  id: string;
  user_id: string;
  book_title: string;
  wpm_speed: number;
  duration_seconds: number;
  words_read: number;
  created_at: string;
}

interface SchulteSession {
  id: string;
  user_id: string;
  completion_time: number;
  created_at: string;
}

export default function AnalyticsView() {
  const { user } = useNeuroStore();
  const profile = useNeuroStore((s) => (s as Record<string, unknown>).profile);
  const readingStats = useNeuroStore((s) => (s as Record<string, unknown>).readingStats) as { totalWordsRead?: number } | undefined;
  const [readingSessions, setReadingSessions] = useState<ReadingSession[]>([]);
  const [schulteSessions, setSchulteSessions] = useState<SchulteSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchAnalyticsData();
    }
  }, [user?.id]);

  // Refresh when reading stats change (new session added)
  useEffect(() => {
    if (user?.id && (readingStats?.totalWordsRead ?? 0) > 0) {
      // Debounce refresh to avoid too many calls
      const timeoutId = setTimeout(() => {
        fetchAnalyticsData();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [readingStats?.totalWordsRead, user?.id]);

  const fetchAnalyticsData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    const supabase = createClient();

    try {
      // Fetch reading sessions
      // @ts-ignore - reading_sessions table may not be in type definitions
      const { data: readingData, error: readingError } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      // Fetch schulte sessions
      // @ts-ignore - schulte_sessions table may not be in type definitions
      const { data: schulteData, error: schulteError } = await supabase
        .from('schulte_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (readingError) console.error('Error fetching reading sessions:', readingError);
      if (schulteError) console.error('Error fetching schulte sessions:', schulteError);

      setReadingSessions((readingData as ReadingSession[]) || []);
      setSchulteSessions((schulteData as SchulteSession[]) || []);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare chart data
  const readingChartData = readingSessions.map((session) => ({
    date: formatDateForChart(session.created_at),
    wpm: session.wpm_speed,
    fullDate: session.created_at,
  }));

  const schulteChartData = schulteSessions.map((session) => {
    // Ensure completion_time is a number
    const completionTime = typeof session.completion_time === 'number' 
      ? session.completion_time 
      : parseFloat(String(session.completion_time)) || 0;
    
    return {
      date: formatDateForChart(session.created_at),
      time: parseFloat(completionTime.toFixed(2)),
      fullDate: session.created_at,
    };
  });

  // Calculate summary stats
  const totalBooksRead = new Set(readingSessions.map(s => s.book_title)).size;
  
  // Fix: Sum all duration_seconds correctly and convert to hours
  const totalSeconds = readingSessions.reduce((sum, s) => {
    // Ensure duration_seconds is a number
    const seconds = typeof s.duration_seconds === 'number' ? s.duration_seconds : 0;
    return sum + seconds;
  }, 0);
  const totalHoursRead = totalSeconds / 3600;
  
  // Format total time display
  const formatTotalTime = (): string => {
    if (totalHoursRead < 1) {
      const minutes = Math.round(totalSeconds / 60);
      return `${minutes} Dk`;
    } else {
      return `${totalHoursRead.toFixed(1)} Saat`;
    }
  };
  
  // CRITICAL: Read Best Speed directly from store profile, not from session history
  // This ensures we always show the latest highest_speed from the database
  const profileHighestSpeed = profile ? (profile as any)?.highest_speed : null;
  const bestWpm = profileHighestSpeed 
    ? Number(profileHighestSpeed) 
    : (readingSessions.length > 0
        ? Math.max(...readingSessions.map(s => s.wpm_speed))
        : 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
          <p className="text-sm text-zinc-500">Analitik veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-white bg-clip-text text-transparent">
          Analitik Dashboard
        </h2>
        <p className="text-zinc-500 text-sm mt-1">
          Okuma performansınızı ve ilerlemenizi görselleştirin.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn("overflow-hidden border-white/10 bg-zinc-900/80")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 mb-1">Toplam Kitap</p>
                <p className="text-2xl font-bold text-white">{totalBooksRead}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/20">
                <BookOpen className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("overflow-hidden border-white/10 bg-zinc-900/80")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 mb-1">Toplam Saat</p>
                <p className="text-2xl font-bold text-white">
                  {formatTotalTime()}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("overflow-hidden border-white/10 bg-zinc-900/80")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 mb-1">En İyi Hız</p>
                <p className="text-2xl font-bold text-white">{bestWpm} WPM</p>
              </div>
              <div className="p-3 rounded-full bg-amber-500/20">
                <TrendingUp className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reading Progress Chart */}
        <Card className={cn("overflow-hidden border-white/10 bg-zinc-900/80")}>
          <CardHeader>
            <h3 className="text-lg font-semibold">Okuma Hızı İlerlemesi</h3>
            <p className="text-sm text-zinc-500">Zaman içinde WPM değişimi</p>
          </CardHeader>
          <CardContent>
            {readingChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={readingChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    label={{ value: 'WPM', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6',
                    }}
                    labelStyle={{ color: '#9CA3AF' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const wpmValue = payload[0]?.value ?? 0;
                        return (
                          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
                            <p className="text-zinc-300 text-sm mb-1">Tarih: {label}</p>
                            <p className="text-white font-semibold">{typeof wpmValue === 'number' ? wpmValue : Number(wpmValue)} WPM</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="wpm"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="WPM"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-zinc-500">
                <p>Henüz okuma verisi yok</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schulte Reaction Time Chart */}
        <Card className={cn("overflow-hidden border-white/10 bg-zinc-900/80")}>
          <CardHeader>
            <h3 className="text-lg font-semibold">Schulte Tepki Süresi</h3>
            <p className="text-sm text-zinc-500">Tamamlama süresi (saniye) - Düşük daha iyi</p>
          </CardHeader>
          <CardContent>
            {schulteChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={schulteChartData}>
                  <defs>
                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    label={{ value: 'Saniye', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
                    style={{ fontSize: '12px' }}
                    reversed
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6',
                    }}
                    labelStyle={{ color: '#9CA3AF' }}
                    formatter={(value: number) => [`${value.toFixed(2)}s`, 'Süre']}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="time"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTime)"
                    name="Tamamlama Süresi"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-zinc-500">
                <p>Henüz Schulte verisi yok</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
