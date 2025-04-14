import { formatCurrency, formatDate, timeAgo, cn } from '../lib/utils';

describe('utility functions', () => {
  describe('formatCurrency', () => {
    it('formats a number as USD currency', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('handles negative numbers', () => {
      expect(formatCurrency(-1000)).toBe('-$1,000.00');
    });

    it('supports custom formatting options', () => {
      expect(formatCurrency(1000000, { notation: 'compact' })).toBe('$1M');
      expect(formatCurrency(1000, { maximumFractionDigits: 0 })).toBe('$1,000');
    });
  });

  describe('formatDate', () => {
    it('formats a date string as a readable date', () => {
      const date = new Date('2025-04-14T12:00:00Z');
      const result = formatDate(date);
      expect(result).toMatch(/Apr(il)? 14, 2025/); // Accommodates different locales
    });

    it('handles custom date formats', () => {
      const date = new Date('2025-04-14T12:00:00Z');
      const result = formatDate(date, { month: 'long', day: 'numeric' });
      expect(result).toMatch(/April 14/);
    });
  });

  describe('timeAgo', () => {
    beforeAll(() => {
      // Mock Date.now to return a fixed timestamp
      jest.spyOn(Date, 'now').mockImplementation(() => new Date('2025-04-14T12:00:00Z').getTime());
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('shows "just now" for recent dates', () => {
      const now = new Date('2025-04-14T12:00:00Z');
      expect(timeAgo(now)).toBe('just now');
    });

    it('shows minutes ago for dates within the hour', () => {
      const date = new Date('2025-04-14T11:55:00Z'); // 5 minutes before mocked now
      expect(timeAgo(date)).toBe('5 minutes ago');
    });

    it('shows hours ago for dates within the day', () => {
      const date = new Date('2025-04-14T10:00:00Z'); // 2 hours before mocked now
      expect(timeAgo(date)).toBe('2 hours ago');
    });

    it('shows days ago for dates within the week', () => {
      const date = new Date('2025-04-12T12:00:00Z'); // 2 days before mocked now
      expect(timeAgo(date)).toBe('2 days ago');
    });
  });

  describe('cn function', () => {
    it('combines class names correctly', () => {
      expect(cn('a', 'b')).toBe('a b');
      expect(cn('a', undefined, 'b', null)).toBe('a b');
      expect(cn('a', false && 'b', true && 'c')).toBe('a c');
    });
  });
});