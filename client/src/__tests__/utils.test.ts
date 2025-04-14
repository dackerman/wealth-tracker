import { formatCurrency, formatDate, timeAgo } from '../lib/utils';

describe('Utility functions', () => {
  describe('formatCurrency', () => {
    it('formats a number as USD currency', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('formats a negative number correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('respects the notation option for large numbers', () => {
      expect(formatCurrency(1234567, { notation: 'compact' })).toBe('$1.23M');
    });
  });

  describe('formatDate', () => {
    it('formats a date with default options', () => {
      const date = new Date('2025-01-15T12:00:00');
      expect(formatDate(date)).toMatch(/Jan 15, 2025/);
    });

    it('respects custom format options', () => {
      const date = new Date('2025-01-15T12:00:00');
      expect(formatDate(date, { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })).toMatch(/01\/15\/2025/);
    });
  });

  describe('timeAgo', () => {
    it('returns "just now" for recent dates', () => {
      const now = new Date();
      expect(timeAgo(now)).toBe('just now');
    });

    it('returns minutes ago for dates in the past hour', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 30);
      expect(timeAgo(date)).toBe('30 minutes ago');
    });

    it('returns hours ago for dates in the past day', () => {
      const date = new Date();
      date.setHours(date.getHours() - 5);
      expect(timeAgo(date)).toBe('5 hours ago');
    });
  });
});