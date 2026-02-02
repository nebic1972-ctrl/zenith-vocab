"use client";

import { Lock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNeuroStore } from "@/store/useNeuroStore";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  checkCondition: (stats: {
    totalWordsRead: number;
    highestSpeed: number;
    streak: number;
  }) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "novice",
    title: "Acemi Okur",
    description: "1,000 kelime oku",
    icon: "📚",
    gradient: "from-yellow-400 to-orange-500",
    checkCondition: (stats) => stats.totalWordsRead >= 1000,
  },
  {
    id: "bookworm",
    title: "Kitap Kurdu",
    description: "10,000 kelime oku",
    icon: "🐛",
    gradient: "from-purple-400 to-pink-500",
    checkCondition: (stats) => stats.totalWordsRead >= 10000,
  },
  {
    id: "speed",
    title: "Hız Canavarı",
    description: "400 WPM hıza ulaş",
    icon: "⚡",
    gradient: "from-blue-400 to-cyan-500",
    checkCondition: (stats) => stats.highestSpeed >= 400,
  },
  {
    id: "consistent",
    title: "İstikrarlı",
    description: "3 gün üst üste oku",
    icon: "🔥",
    gradient: "from-red-400 to-orange-500",
    checkCondition: (stats) => stats.streak >= 3,
  },
];

export default function Achievements() {
  const readingStats = useNeuroStore((s) => s.readingStats);

  // Safe access with fallbacks
  const stats = {
    totalWordsRead: readingStats?.totalWordsRead ?? 0,
    highestSpeed: readingStats?.highestSpeed ?? 0,
    streak: readingStats?.streak ?? 0,
  };

  const unlockedCount = ACHIEVEMENTS.filter((achievement) =>
    achievement.checkCondition(stats)
  ).length;

  return (
    <Card className={cn("overflow-hidden border-white/10 bg-zinc-900/80")}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-white bg-clip-text text-transparent">
              Başarımlar
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              {unlockedCount} / {ACHIEVEMENTS.length} başarım açıldı
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = achievement.checkCondition(stats);

            return (
              <div
                key={achievement.id}
                className={cn(
                  "relative rounded-xl p-6 border-2 transition-all duration-300",
                  isUnlocked
                    ? cn(
                        "bg-gradient-to-br",
                        achievement.gradient,
                        "border-transparent shadow-lg shadow-purple-500/20",
                        "hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30"
                      )
                    : "bg-zinc-800/50 border-zinc-700 opacity-50"
                )}
              >
                {/* Glowing effect for unlocked */}
                {isUnlocked && (
                  <div
                    className={cn(
                      "absolute inset-0 rounded-xl opacity-20 blur-xl",
                      `bg-gradient-to-br ${achievement.gradient}`
                    )}
                  />
                )}

                <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                  {/* Icon */}
                  <div className="text-5xl mb-2">{achievement.icon}</div>

                  {/* Status Icon */}
                  <div className="absolute top-3 right-3">
                    {isUnlocked ? (
                      <CheckCircle2 className="h-6 w-6 text-white drop-shadow-lg" />
                    ) : (
                      <Lock className="h-5 w-5 text-zinc-500" />
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className={cn(
                      "text-lg font-bold",
                      isUnlocked ? "text-white" : "text-zinc-400"
                    )}
                  >
                    {achievement.title}
                  </h3>

                  {/* Description */}
                  <p
                    className={cn(
                      "text-sm",
                      isUnlocked ? "text-white/90" : "text-zinc-500"
                    )}
                  >
                    {achievement.description}
                  </p>

                  {/* Progress indicator for locked achievements */}
                  {!isUnlocked && (
                    <div className="mt-2 text-xs text-zinc-600">
                      {achievement.id === "novice" && (
                        <span>
                          {Math.min(stats.totalWordsRead, 1000)} / 1,000
                        </span>
                      )}
                      {achievement.id === "bookworm" && (
                        <span>
                          {Math.min(stats.totalWordsRead, 10000)} / 10,000
                        </span>
                      )}
                      {achievement.id === "speed" && (
                        <span>
                          {Math.min(stats.highestSpeed, 400)} / 400 WPM
                        </span>
                      )}
                      {achievement.id === "consistent" && (
                        <span>{Math.min(stats.streak, 3)} / 3 gün</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
