import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency (USD by default)
 */
export function formatCurrency(
  amount: number | string,
  options?: {
    currency?: string;
    locale?: string;
    notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const {
    currency = "USD",
    locale = "en-US",
    notation = "standard",
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options || {};
  
  const numberAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numberAmount)) {
    return "$0.00";
  }
  
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numberAmount);
}

/**
 * Format a date as a string
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = { 
    year: "numeric", 
    month: "short", 
    day: "numeric" 
  }
): string {
  const dateObject = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", options).format(dateObject);
}

/**
 * Get a readable time ago string (e.g. "2 hours ago")
 */
export function timeAgo(date: Date | string): string {
  const now = new Date();
  const dateObject = typeof date === "string" ? new Date(date) : date;
  
  const seconds = Math.floor((now.getTime() - dateObject.getTime()) / 1000);
  
  // Less than a minute
  if (seconds < 60) {
    return "just now";
  }
  
  // Less than an hour
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }
  
  // Less than a day
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  
  // Less than a week
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }
  
  // Default to formatted date
  return formatDate(dateObject);
}
