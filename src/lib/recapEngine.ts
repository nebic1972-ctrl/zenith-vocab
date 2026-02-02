export type WeeklyDataPoint = {
  date: string;
  speed: number;
  comprehension: number;
  focus: number;
};

export type WeeklyRecap = {
  avgSpeed: number;
  bestDay: WeeklyDataPoint;
  insight: string;
};

/**
 * Haftalık okuma verisinden özet + stratejik analiz üretir.
 * Veri seti: [{ date: 'Mon', speed: 320, comprehension: 85, focus: 40 }, ...]
 */
export function generateWeeklyRecap(weeklyData: WeeklyDataPoint[]): WeeklyRecap {
  const len = Math.max(weeklyData.length, 1);
  const avgSpeed = weeklyData.reduce((acc, d) => acc + d.speed, 0) / len;
  const bestDay: WeeklyDataPoint =
    weeklyData.length > 0
      ? [...weeklyData].sort((a, b) => b.comprehension - a.comprehension)[0]
      : { date: '', speed: 0, comprehension: 0, focus: 0 };

  let insight: string;
  if (avgSpeed > 400 && bestDay.comprehension < 70) {
    insight =
      "Bu hafta hız limitlerini zorladınız ancak anlama skorunuz bu hıza yetişemedi. Gelecek hafta 'Smart Chunking' özelliğini 2 kelimeye sabitlemenizi öneririm.";
  } else {
    insight =
      'Bilişsel dengeniz mükemmel. Özellikle Salı günü sergilediğiniz odaklanma performansı, ideal çalışma ritminizi yansıtıyor.';
  }

  return { avgSpeed, bestDay, insight };
}
