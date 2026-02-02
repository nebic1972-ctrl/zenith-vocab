"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, BookOpen, Eye, Grid3x3 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNeuroStore } from "@/store/useNeuroStore";
import { createClient } from "@/lib/supabase/client";
import { Progress } from "@/components/ui/progress";

interface DailyGoalsProps {
  onNavigateToExercise?: (exercise: 'schulte' | 'eyetracking') => void;
  onNavigateToLibrary?: () => void;
}

export default function DailyGoals({ onNavigateToExercise, onNavigateToLibrary }: DailyGoalsProps) {
  const { user } = useNeuroStore();
  const readingStats = useNeuroStore((s) => s.readingStats);
  const dailyPlan = useNeuroStore((s) => s.dailyPlan);
  const generateDailyPlan = useNeuroStore((s) => s.generateDailyPlan);
  const updateTaskProgress = useNeuroStore((s) => s.updateTaskProgress);
  const eyeTrackerStats = useNeuroStore((s) => s.eyeTrackerStats);
  const [schulteSessionsToday, setSchulteSessionsToday] = useState(0);
  const [eyeExerciseMinutesToday, setEyeExerciseMinutesToday] = useState(0);

  // Generate plan on mount if needed
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (dailyPlan.date !== today || dailyPlan.tasks.length === 0) {
      generateDailyPlan();
    }
  }, [dailyPlan.date, dailyPlan.tasks.length, generateDailyPlan]);

  // Fetch today's exercise stats
  useEffect(() => {
    if (!user?.id) return;

    const fetchTodayStats = async () => {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      try {
        // Fetch Schulte sessions today
        const { data: schulteSessions, error: schulteError } = await supabase
          .from('schulte_sessions')
          .select('completion_time')
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`);

        if (!schulteError && schulteSessions) {
          setSchulteSessionsToday(schulteSessions.length);
        }

        // Eye exercise stats are tracked in localStorage via eyeTrackerStats
        // We'll use the last session date to check if it's today
        if (eyeTrackerStats.lastSession) {
          const lastSessionDate = new Date(eyeTrackerStats.lastSession).toISOString().split('T')[0];
          if (lastSessionDate === today) {
            // Estimate minutes from total (this is approximate)
            // In a real implementation, you'd track per-session minutes
            setEyeExerciseMinutesToday(Math.floor(eyeTrackerStats.totalMinutes));
          }
        }
      } catch (error) {
        console.error('Failed to fetch today stats:', error);
      }
    };

    fetchTodayStats();
  }, [user?.id, eyeTrackerStats.lastSession, eyeTrackerStats.totalMinutes]);

  // Update task progress based on actual stats
  useEffect(() => {
    const dailyWords = readingStats?.dailyWords ?? 0;

    dailyPlan.tasks.forEach(task => {
      let currentProgress = 0;

      if (task.type === 'read') {
        currentProgress = Math.min(dailyWords, task.target);
      } else if (task.type === 'exercise_schulte') {
        currentProgress = Math.min(schulteSessionsToday, task.target);
      } else if (task.type === 'exercise_eye') {
        currentProgress = Math.min(eyeExerciseMinutesToday, task.target);
      }

      // Only update if progress changed
      if (currentProgress !== task.progress) {
        updateTaskProgress(task.id, currentProgress);
      }
    });
  }, [readingStats?.dailyWords, schulteSessionsToday, eyeExerciseMinutesToday, dailyPlan.tasks, updateTaskProgress]);

  const handleTaskClick = (task: typeof dailyPlan.tasks[0]) => {
    if (task.completed) return;

    if (task.type === 'read') {
      onNavigateToLibrary?.();
    } else if (task.type === 'exercise_schulte') {
      onNavigateToExercise?.('schulte');
    } else if (task.type === 'exercise_eye') {
      onNavigateToExercise?.('eyetracking');
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'read':
        return <BookOpen className="h-4 w-4" />;
      case 'exercise_eye':
        return <Eye className="h-4 w-4" />;
      case 'exercise_schulte':
        return <Grid3x3 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTaskUnit = (type: string) => {
    switch (type) {
      case 'read':
        return 'kelime';
      case 'exercise_eye':
        return 'dakika';
      case 'exercise_schulte':
        return 'oturum';
      default:
        return '';
    }
  };

  const completedCount = dailyPlan.tasks.filter(t => t.completed).length;
  const totalTasks = dailyPlan.tasks.length;

  return (
    <Card className={cn("overflow-hidden border-white/10 bg-zinc-900/80")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Bugünün Nöro-Reçetesi</h2>
          <span className="text-sm text-zinc-500">
            {completedCount} / {totalTasks}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {dailyPlan.tasks.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-4">
            Plan yükleniyor...
          </p>
        ) : (
          <ul className="space-y-3">
            {dailyPlan.tasks.map((task) => {
              const progressPercent = task.target > 0 
                ? Math.min((task.progress / task.target) * 100, 100) 
                : 0;

              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => handleTaskClick(task)}
                    disabled={task.completed}
                    className={cn(
                      "flex w-full flex-col gap-2 rounded-lg px-3 py-3 text-left transition",
                      "hover:bg-zinc-800/60",
                      task.completed && "opacity-60 cursor-default",
                      !task.completed && "cursor-pointer"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {task.completed ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 shrink-0 text-zinc-600 border-2 border-zinc-600" />
                        )}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-zinc-400 shrink-0">
                            {getTaskIcon(task.type)}
                          </span>
                          <span className="text-sm font-medium truncate">
                            {task.title}
                          </span>
                        </div>
                      </div>
                      {task.completed && (
                        <span className="text-xs text-green-500 font-medium shrink-0">
                          Tamamlandı
                        </span>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    {!task.completed && (
                      <div className="space-y-1">
                        <Progress 
                          value={progressPercent} 
                          className="h-2 bg-zinc-800"
                        />
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <span>
                            {task.progress} / {task.target} {getTaskUnit(task.type)}
                          </span>
                          <span>{Math.round(progressPercent)}%</span>
                        </div>
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
