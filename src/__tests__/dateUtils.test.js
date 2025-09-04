import {
  formatDateTime,
  reformatDateTime,
  roundUpDateTime,
  isHaltedSameDay,
  getCurrentDateTime
} from '../utils/dateUtils';

describe('dateUtils', () => {
  describe('formatDateTime', () => {
    it('should return null for null input', () => {
      expect(formatDateTime(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(formatDateTime(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(formatDateTime('')).toBeNull();
    });

    it('should format valid ISO string to ISO string', () => {
      const input = '2023-12-25T10:30:45.123Z';
      const result = formatDateTime(input);
      expect(result).toBe('2023-12-25T10:30:45.123Z');
    });

    it('should format compact datetime to ISO string', () => {
      const input = '20231225-10:30:45.123';
      const result = formatDateTime(input);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      // Note: Result will be in UTC, so may differ by timezone offset
      const expectedDate = new Date(2023, 11, 25, 10, 30, 45, 123);
      expect(result).toBe(expectedDate.toISOString());
    });

    it('should format valid date string to ISO string', () => {
      const input = '2023-12-25 10:30:45';
      const result = formatDateTime(input);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return original string for invalid date', () => {
      const input = 'invalid-date';
      const result = formatDateTime(input);
      expect(result).toBe('invalid-date');
    });

    it('should handle edge case dates', () => {
      const input = '2000-01-01T00:00:00.000Z';
      const result = formatDateTime(input);
      expect(result).toBe('2000-01-01T00:00:00.000Z');
    });

    it('should handle compact datetime edge cases', () => {
      const input = '20000101-00:00:00.000';
      const result = formatDateTime(input);
      const expectedDate = new Date(2000, 0, 1, 0, 0, 0, 0);
      expect(result).toBe(expectedDate.toISOString());
    });
  });

  describe('reformatDateTime', () => {
    it('should return input unchanged for null', () => {
      expect(reformatDateTime(null)).toBeNull();
    });

    it('should return input unchanged for undefined', () => {
      expect(reformatDateTime(undefined)).toBeUndefined();
    });

    it('should return input unchanged for empty string', () => {
      expect(reformatDateTime('')).toBe('');
    });

    it('should replace T with space in ISO string', () => {
      const input = '2023-12-25T10:30:45.123Z';
      const result = reformatDateTime(input);
      expect(result).toBe('2023-12-25 10:30:45.123Z');
    });

    it('should convert compact datetime to standard format', () => {
      const input = '20231225-10:30:45.123';
      const result = reformatDateTime(input);
      expect(result).toBe('2023-12-25 10:30:45.123');
    });

    it('should handle compact datetime with zeros', () => {
      const input = '20231225-00:00:00.000';
      const result = reformatDateTime(input);
      expect(result).toBe('2023-12-25 00:00:00.000');
    });

    it('should replace multiple T characters', () => {
      const input = '2023-12-25T10:30:45T123Z';
      const result = reformatDateTime(input);
      expect(result).toBe('2023-12-25 10:30:45 123Z');
    });

    it('should handle string without T', () => {
      const input = '2023-12-25 10:30:45';
      const result = reformatDateTime(input);
      expect(result).toBe('2023-12-25 10:30:45');
    });

    it('should handle string with only T', () => {
      const input = 'T';
      const result = reformatDateTime(input);
      expect(result).toBe(' ');
    });
  });

  describe('roundUpDateTime', () => {
    it('should return input unchanged for null', () => {
      expect(roundUpDateTime(null)).toBeNull();
    });

    it('should return input unchanged for undefined', () => {
      expect(roundUpDateTime(undefined)).toBeUndefined();
    });

    it('should return input unchanged for empty string', () => {
      expect(roundUpDateTime('')).toBe('');
    });

    it('should round up time when milliseconds > 0', () => {
      const input = '2023-12-25T10:30:45.123Z';
      const result = roundUpDateTime(input);
      // Result should be rounded up by 1 second, in local time format
      const inputDate = new Date(input);
      const expectedDate = new Date(inputDate.getTime() + 1000 - inputDate.getMilliseconds());
      const expectedString = expectedDate.getFullYear() + '-' +
        String(expectedDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(expectedDate.getDate()).padStart(2, '0') + ' ' +
        String(expectedDate.getHours()).padStart(2, '0') + ':' +
        String(expectedDate.getMinutes()).padStart(2, '0') + ':' +
        String(expectedDate.getSeconds()).padStart(2, '0') + '.000';
      expect(result).toBe(expectedString);
    });

    it('should round up compact datetime when milliseconds > 0', () => {
      const input = '20231225-10:30:45.123';
      const result = roundUpDateTime(input);
      expect(result).toBe('2023-12-25 10:30:46.000');
    });

    it('should not change time when milliseconds = 0', () => {
      const input = '2023-12-25T10:30:45.000Z';
      const result = roundUpDateTime(input);
      // Convert to local time for comparison
      const inputDate = new Date(input);
      const expectedString = inputDate.getFullYear() + '-' +
        String(inputDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(inputDate.getDate()).padStart(2, '0') + ' ' +
        String(inputDate.getHours()).padStart(2, '0') + ':' +
        String(inputDate.getMinutes()).padStart(2, '0') + ':' +
        String(inputDate.getSeconds()).padStart(2, '0') + '.000';
      expect(result).toBe(expectedString);
    });

    it('should not change compact datetime when milliseconds = 0', () => {
      const input = '20231225-10:30:45.000';
      const result = roundUpDateTime(input);
      expect(result).toBe('2023-12-25 10:30:45.000');
    });

    it('should handle edge case - round up causes minute rollover', () => {
      const input = '2023-12-25T10:30:59.500Z';
      const result = roundUpDateTime(input);
      const inputDate = new Date(input);
      const expectedDate = new Date(inputDate.getTime() + 1000 - inputDate.getMilliseconds());
      const expectedString = expectedDate.getFullYear() + '-' +
        String(expectedDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(expectedDate.getDate()).padStart(2, '0') + ' ' +
        String(expectedDate.getHours()).padStart(2, '0') + ':' +
        String(expectedDate.getMinutes()).padStart(2, '0') + ':' +
        String(expectedDate.getSeconds()).padStart(2, '0') + '.000';
      expect(result).toBe(expectedString);
    });

    it('should handle edge case - round up causes hour rollover', () => {
      const input = '2023-12-25T10:59:59.001Z';
      const result = roundUpDateTime(input);
      const inputDate = new Date(input);
      const expectedDate = new Date(inputDate.getTime() + 1000 - inputDate.getMilliseconds());
      const expectedString = expectedDate.getFullYear() + '-' +
        String(expectedDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(expectedDate.getDate()).padStart(2, '0') + ' ' +
        String(expectedDate.getHours()).padStart(2, '0') + ':' +
        String(expectedDate.getMinutes()).padStart(2, '0') + ':' +
        String(expectedDate.getSeconds()).padStart(2, '0') + '.000';
      expect(result).toBe(expectedString);
    });

    it('should handle edge case - round up causes day rollover', () => {
      const input = '2023-12-25T23:59:59.999Z';
      const result = roundUpDateTime(input);
      const inputDate = new Date(input);
      const expectedDate = new Date(inputDate.getTime() + 1000 - inputDate.getMilliseconds());
      const expectedString = expectedDate.getFullYear() + '-' +
        String(expectedDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(expectedDate.getDate()).padStart(2, '0') + ' ' +
        String(expectedDate.getHours()).padStart(2, '0') + ':' +
        String(expectedDate.getMinutes()).padStart(2, '0') + ':' +
        String(expectedDate.getSeconds()).padStart(2, '0') + '.000';
      expect(result).toBe(expectedString);
    });

    it('should handle compact datetime rollover cases', () => {
      const input = '20231225-23:59:59.999';
      const result = roundUpDateTime(input);
      expect(result).toBe('2023-12-26 00:00:00.000');
    });

    it('should format output without T and Z', () => {
      const input = '2023-12-25T10:30:45.100Z';
      const result = roundUpDateTime(input);
      expect(result).not.toContain('T');
      expect(result).not.toContain('Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/);
    });
  });

  describe('isHaltedSameDay', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return true when resumption time is same day as current time', () => {
      const mockDate = new Date('2023-12-25T15:30:00Z');
      jest.setSystemTime(mockDate);
      
      const resumptionTime = '2023-12-25T10:00:00Z';
      const result = isHaltedSameDay('unused', resumptionTime);
      
      expect(result).toBe(true);
    });

    it('should return true for compact datetime same day', () => {
      const mockDate = new Date('2023-12-25T15:30:00Z');
      jest.setSystemTime(mockDate);
      
      const resumptionTime = '20231225-10:00:00.000';
      const result = isHaltedSameDay('unused', resumptionTime);
      
      expect(result).toBe(true);
    });

    it('should return false when resumption time is different day', () => {
      const mockDate = new Date('2023-12-25T15:30:00Z');
      jest.setSystemTime(mockDate);
      
      const resumptionTime = '2023-12-24T10:00:00Z';
      const result = isHaltedSameDay('unused', resumptionTime);
      
      expect(result).toBe(false);
    });

    it('should return false when resumption time is future day', () => {
      const mockDate = new Date('2023-12-25T15:30:00Z');
      jest.setSystemTime(mockDate);
      
      const resumptionTime = '2023-12-26T10:00:00Z';
      const result = isHaltedSameDay('unused', resumptionTime);
      
      expect(result).toBe(false);
    });

    it('should return false when resumption time is different month', () => {
      const mockDate = new Date('2023-12-25T15:30:00Z');
      jest.setSystemTime(mockDate);
      
      const resumptionTime = '2023-11-25T10:00:00Z';
      const result = isHaltedSameDay('unused', resumptionTime);
      
      expect(result).toBe(false);
    });

    it('should return false when resumption time is different year', () => {
      const mockDate = new Date('2023-12-25T15:30:00Z');
      jest.setSystemTime(mockDate);
      
      const resumptionTime = '2022-12-25T10:00:00Z';
      const result = isHaltedSameDay('unused', resumptionTime);
      
      expect(result).toBe(false);
    });

    it('should handle edge case - same day different timezone', () => {
      // Set current time to Dec 25, 2023 at 11:30 PM local time  
      const mockDate = new Date(2023, 11, 25, 23, 30, 0, 0);
      jest.setSystemTime(mockDate);
      
      // Set resumption time to same day but earlier time
      const resumptionTime = new Date(2023, 11, 25, 1, 0, 0, 0).toISOString();
      const result = isHaltedSameDay('unused', resumptionTime);
      
      expect(result).toBe(true);
    });

    it('should ignore haltTime parameter', () => {
      const mockDate = new Date('2023-12-25T15:30:00Z');
      jest.setSystemTime(mockDate);
      
      const resumptionTime = '2023-12-25T10:00:00Z';
      const result1 = isHaltedSameDay('2023-12-20T00:00:00Z', resumptionTime);
      const result2 = isHaltedSameDay('invalid-date', resumptionTime);
      const result3 = isHaltedSameDay(null, resumptionTime);
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });
  });

  describe('getCurrentDateTime', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return current date time in compact format', () => {
      const mockDate = new Date(2023, 11, 25, 15, 30, 45, 123);
      jest.setSystemTime(mockDate);
      
      const result = getCurrentDateTime();
      expect(result).toBe('20231225-15:30:45.123');
    });

    it('should pad single digit values with zeros', () => {
      const mockDate = new Date(2023, 0, 5, 9, 8, 7, 123);
      jest.setSystemTime(mockDate);
      
      const result = getCurrentDateTime();
      expect(result).toBe('20230105-09:08:07.123');
    });

    it('should handle edge case - start of year', () => {
      const mockDate = new Date(2023, 0, 1, 0, 0, 0, 0);
      jest.setSystemTime(mockDate);
      
      const result = getCurrentDateTime();
      expect(result).toBe('20230101-00:00:00.000');
    });

    it('should handle edge case - end of year', () => {
      const mockDate = new Date(2023, 11, 31, 23, 59, 59, 999);
      jest.setSystemTime(mockDate);
      
      const result = getCurrentDateTime();
      expect(result).toBe('20231231-23:59:59.999');
    });

    it('should return string in correct compact format', () => {
      const mockDate = new Date(2023, 5, 15, 12, 34, 56, 789);
      jest.setSystemTime(mockDate);
      
      const result = getCurrentDateTime();
      expect(result).toMatch(/^\d{8}-\d{2}:\d{2}:\d{2}\.\d{3}$/);
    });

    it('should handle leap year', () => {
      const mockDate = new Date(2024, 1, 29, 12, 0, 0, 0);
      jest.setSystemTime(mockDate);
      
      const result = getCurrentDateTime();
      expect(result).toBe('20240229-12:00:00.000');
    });
  });
});