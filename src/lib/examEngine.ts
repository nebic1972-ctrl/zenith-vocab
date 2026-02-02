/**
 * Sınav tarihine göre antrenman yoğunluğu çarpanı.
 * @param examDate YYYY-MM-DD formatında sınav tarihi
 * @returns 1.0 (normal) | 1.5 (sprint) | 2.0 (peak) | 2.5 (simülasyon)
 */
export function calculateExamIntensity(examDate: string): number {
  const daysLeft = Math.ceil(
    (new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft > 60) return 1.0; // Normal tempo
  if (daysLeft > 30) return 1.5; // Yoğun tempo (Sprint)
  if (daysLeft > 7) return 2.0; // Maksimum odak (Peak)
  return 2.5; // Simülasyon modu
}
