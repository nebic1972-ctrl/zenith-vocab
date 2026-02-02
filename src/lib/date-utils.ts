/**
 * Date formatting utility with locale and time format support
 * Uses store settings for locale and time format
 */

import { useNeuroStore } from "@/store/useNeuroStore";

/**
 * Get the effective locale from store settings
 * If 'auto', uses navigator.language
 */
export function getEffectiveLocale(): string {
  const userSettings = useNeuroStore.getState().userSettings;
  const locale = userSettings?.locale || 'auto';
  
  if (locale === 'auto') {
    return typeof navigator !== 'undefined' ? navigator.language : 'tr-TR';
  }
  
  return locale;
}

/**
 * Get the effective time format from store settings
 * Defaults to '24h' if not set
 */
export function getEffectiveTimeFormat(): '12h' | '24h' {
  const userSettings = useNeuroStore.getState().userSettings;
  return userSettings?.time_format || '24h';
}

/**
 * Format a date string according to locale and time format settings
 * @param dateString - ISO date string or Date object
 * @param options - Intl.DateTimeFormatOptions (optional)
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const locale = getEffectiveLocale();
  const timeFormat = getEffectiveTimeFormat();
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Default options if not provided
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    ...(timeFormat === '12h' ? { hour: 'numeric', minute: '2-digit', hour12: true } : {}),
    ...(timeFormat === '24h' && options?.hour !== undefined ? { hour: 'numeric', minute: '2-digit', hour12: false } : {}),
  };
  
  const formatOptions = { ...defaultOptions, ...options };
  
  return new Intl.DateTimeFormat(locale, formatOptions).format(date);
}

/**
 * Format date for chart display (short format)
 */
export function formatDateForChart(dateString: string | Date): string {
  return formatDate(dateString, { month: 'short', day: 'numeric' });
}

/**
 * Format date and time for display
 */
export function formatDateTime(dateString: string | Date): string {
  const timeFormat = getEffectiveTimeFormat();
  return formatDate(dateString, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  });
}
