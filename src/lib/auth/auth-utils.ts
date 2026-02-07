/**
 * ZENITH-Vocab Auth Utils
 * Server ve client'ta kullanılabilen yardımcı fonksiyonlar
 */

/**
 * Kullanıcı metadata'sında onboarding tamamlanmış mı kontrol eder.
 */
export function isOnboardingCompleted(
  metadata: Record<string, unknown> | null | undefined
): boolean {
  if (!metadata) return false
  return Boolean(metadata.onboarding_completed)
}
