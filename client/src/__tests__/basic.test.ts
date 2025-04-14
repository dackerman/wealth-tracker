import { formatCurrency, formatDate, timeAgo } from '../lib/utils';

describe('Basic utils tests', () => {
  test('formatCurrency should format a number as USD currency', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  test('formatDate should format a date with default options', () => {
    // Using a fixed date to avoid time zone issues
    const date = new Date('2025-01-15T12:00:00Z');
    const result = formatDate(date);
    // Just check it contains the expected parts rather than the exact format
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });

  test('timeAgo should work for recent dates', () => {
    const now = new Date();
    expect(timeAgo(now)).toBe('just now');
  });
});