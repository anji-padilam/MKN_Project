import { TFunction } from 'react-i18next';

/**
 * Centralized time formatting utility
 * Handles all time ago calculations consistently across the application
 */

export interface TimeAgoOptions {
  t?: TFunction;
  fallbackLanguage?: string;
}

/**
 * Formats a date string or Date object into a human-readable "time ago" string
 * @param date - Date string or Date object
 * @param options - Optional configuration including translation function
 * @returns Formatted time string (e.g., "2 hours ago", "3 days ago")
 */
export const formatTimeAgo = (date: string | Date, options: TimeAgoOptions = {}): string => {
  const { t, fallbackLanguage = 'en' } = options;
  
  // Convert to Date object if it's a string
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  // Validate the date
  if (isNaN(targetDate.getTime())) {
    console.warn('Invalid date provided to formatTimeAgo:', date);
    return t ? t('time.justNow') : 'Just now';
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
  
  // Handle negative time (future dates)
  if (diffInSeconds < 0) {
    return t ? t('time.justNow') : 'Just now';
  }
  
  // Less than 1 minute
  if (diffInSeconds < 60) {
    return t ? t('time.justNow') : 'Just now';
  }
  
  // Less than 1 hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return t ? t('time.minutesAgo', { count: minutes }) : `${minutes}m ago`;
  }
  
  // Less than 24 hours
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return t ? t('time.hoursAgo', { count: hours }) : `${hours}h ago`;
  }
  
  // Less than 30 days
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return t ? t('time.daysAgo', { count: days }) : `${days}d ago`;
  }
  
  // Less than 1 year
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return t ? t('time.monthsAgo', { count: months }) : `${months}mo ago`;
  }
  
  // More than 1 year
  const years = Math.floor(diffInSeconds / 31536000);
  return t ? t('time.yearsAgo', { count: years }) : `${years}y ago`;
};

/**
 * Formats a date string into a readable date format
 * @param dateString - ISO date string
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted date string
 */
export const formatDate = (dateString: string, locale: string = 'en-US'): string => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string provided to formatDate:', dateString);
    return 'Invalid date';
  }
  
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Gets the relative time with proper pluralization support
 * @param date - Date string or Date object
 * @param t - Translation function
 * @returns Localized time string
 */
export const getRelativeTime = (date: string | Date, t: TFunction): string => {
  return formatTimeAgo(date, { t });
};

/**
 * Validates if a date string is valid
 * @param dateString - Date string to validate
 * @returns True if valid, false otherwise
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Gets the time difference in milliseconds
 * @param date - Date string or Date object
 * @returns Time difference in milliseconds
 */
export const getTimeDifference = (date: string | Date): number => {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return now.getTime() - targetDate.getTime();
};

