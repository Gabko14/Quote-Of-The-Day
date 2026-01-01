import { mockDate, restoreDate } from '../setup';

// Mock the db module before importing dailyQuote
jest.mock('../../db', () => ({
  getRandomQuoteExcluding: jest.fn(),
  getRandomQuote: jest.fn(),
  getCurrentQuoteId: jest.fn(),
  setCurrentQuoteId: jest.fn(),
  getLastQuoteDate: jest.fn(),
  setLastQuoteDate: jest.fn(),
  getQuoteById: jest.fn(),
  getQuoteCount: jest.fn(),
}));

import {
  shouldRotateQuote,
  rotateQuote,
  rotateQuoteIfNeeded,
  getDailyQuote,
} from '../../services/dailyQuote';

import {
  getRandomQuoteExcluding,
  getRandomQuote,
  getCurrentQuoteId,
  setCurrentQuoteId,
  getLastQuoteDate,
  setLastQuoteDate,
  getQuoteById,
  getQuoteCount,
} from '../../db';

const mockGetLastQuoteDate = getLastQuoteDate as jest.MockedFunction<typeof getLastQuoteDate>;
const mockGetCurrentQuoteId = getCurrentQuoteId as jest.MockedFunction<typeof getCurrentQuoteId>;
const mockSetCurrentQuoteId = setCurrentQuoteId as jest.MockedFunction<typeof setCurrentQuoteId>;
const mockSetLastQuoteDate = setLastQuoteDate as jest.MockedFunction<typeof setLastQuoteDate>;
const mockGetQuoteById = getQuoteById as jest.MockedFunction<typeof getQuoteById>;
const mockGetQuoteCount = getQuoteCount as jest.MockedFunction<typeof getQuoteCount>;
const mockGetRandomQuote = getRandomQuote as jest.MockedFunction<typeof getRandomQuote>;
const mockGetRandomQuoteExcluding = getRandomQuoteExcluding as jest.MockedFunction<typeof getRandomQuoteExcluding>;

describe('dailyQuote service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    restoreDate();
  });

  describe('shouldRotateQuote', () => {
    it('returns true when lastQuoteDate is null (first run)', async () => {
      mockGetLastQuoteDate.mockResolvedValue(null);
      mockDate('2025-01-15T10:00:00Z');

      const result = await shouldRotateQuote();

      expect(result).toBe(true);
    });

    it('returns true when lastQuoteDate is different from today', async () => {
      mockGetLastQuoteDate.mockResolvedValue('2025-01-14');
      mockDate('2025-01-15T10:00:00Z');

      const result = await shouldRotateQuote();

      expect(result).toBe(true);
    });

    it('returns false when lastQuoteDate is today', async () => {
      mockDate('2025-01-15T10:00:00Z');
      mockGetLastQuoteDate.mockResolvedValue('2025-01-15');

      const result = await shouldRotateQuote();

      expect(result).toBe(false);
    });

    it('handles date formatting correctly with padding', async () => {
      // Test month/day padding (January 5th should be 2025-01-05)
      mockDate('2025-01-05T10:00:00Z');
      mockGetLastQuoteDate.mockResolvedValue('2025-01-05');

      const result = await shouldRotateQuote();

      expect(result).toBe(false);
    });
  });

  describe('rotateQuote', () => {
    const mockQuote1 = { id: 1, text: 'Quote 1', author: 'Author 1', category_id: null, created_at: '' };
    const mockQuote2 = { id: 2, text: 'Quote 2', author: 'Author 2', category_id: null, created_at: '' };

    it('returns null when there are no quotes', async () => {
      mockGetQuoteCount.mockResolvedValue(0);
      mockDate('2025-01-15T10:00:00Z');

      const result = await rotateQuote();

      expect(result).toBeNull();
      expect(mockSetCurrentQuoteId).not.toHaveBeenCalled();
    });

    it('gets a different quote when there are multiple quotes', async () => {
      mockDate('2025-01-15T10:00:00Z');
      mockGetQuoteCount.mockResolvedValue(2);
      mockGetCurrentQuoteId.mockResolvedValue(1);
      mockGetRandomQuoteExcluding.mockResolvedValue(mockQuote2);

      const result = await rotateQuote();

      expect(result).toEqual(mockQuote2);
      expect(mockGetRandomQuoteExcluding).toHaveBeenCalledWith(1);
      expect(mockSetCurrentQuoteId).toHaveBeenCalledWith(2);
      expect(mockSetLastQuoteDate).toHaveBeenCalledWith('2025-01-15');
    });

    it('gets any random quote when only one quote exists', async () => {
      mockDate('2025-01-15T10:00:00Z');
      mockGetQuoteCount.mockResolvedValue(1);
      mockGetCurrentQuoteId.mockResolvedValue(1);
      mockGetRandomQuote.mockResolvedValue(mockQuote1);

      const result = await rotateQuote();

      expect(result).toEqual(mockQuote1);
      expect(mockGetRandomQuote).toHaveBeenCalled();
      expect(mockGetRandomQuoteExcluding).not.toHaveBeenCalled();
    });

    it('gets any random quote when no current quote is set', async () => {
      mockDate('2025-01-15T10:00:00Z');
      mockGetQuoteCount.mockResolvedValue(2);
      mockGetCurrentQuoteId.mockResolvedValue(null);
      mockGetRandomQuote.mockResolvedValue(mockQuote1);

      const result = await rotateQuote();

      expect(result).toEqual(mockQuote1);
      expect(mockGetRandomQuote).toHaveBeenCalled();
    });
  });

  describe('rotateQuoteIfNeeded', () => {
    const mockQuote = { id: 1, text: 'Quote 1', author: 'Author 1', category_id: null, created_at: '' };

    it('does not rotate when quote was set today', async () => {
      mockDate('2025-01-15T10:00:00Z');
      mockGetLastQuoteDate.mockResolvedValue('2025-01-15');
      mockGetCurrentQuoteId.mockResolvedValue(1);
      mockGetQuoteById.mockResolvedValue(mockQuote);

      const result = await rotateQuoteIfNeeded();

      expect(result).toEqual(mockQuote);
      expect(mockGetRandomQuote).not.toHaveBeenCalled();
      expect(mockGetRandomQuoteExcluding).not.toHaveBeenCalled();
    });

    it('rotates when date has changed', async () => {
      const newQuote = { id: 2, text: 'Quote 2', author: 'Author 2', category_id: null, created_at: '' };
      mockDate('2025-01-15T10:00:00Z');
      mockGetLastQuoteDate.mockResolvedValue('2025-01-14');
      mockGetQuoteCount.mockResolvedValue(2);
      mockGetCurrentQuoteId.mockResolvedValue(1);
      mockGetRandomQuoteExcluding.mockResolvedValue(newQuote);

      const result = await rotateQuoteIfNeeded();

      expect(result).toEqual(newQuote);
      expect(mockGetRandomQuoteExcluding).toHaveBeenCalledWith(1);
    });

    it('returns null when no current quote and needs rotation fails', async () => {
      mockDate('2025-01-15T10:00:00Z');
      mockGetLastQuoteDate.mockResolvedValue('2025-01-15');
      mockGetCurrentQuoteId.mockResolvedValue(null);

      const result = await rotateQuoteIfNeeded();

      expect(result).toBeNull();
    });
  });

  describe('getDailyQuote', () => {
    const mockQuote = { id: 1, text: 'Quote 1', author: 'Author 1', category_id: null, created_at: '' };

    it('returns rotated quote when rotation is needed', async () => {
      mockDate('2025-01-15T10:00:00Z');
      mockGetLastQuoteDate.mockResolvedValue('2025-01-14');
      mockGetQuoteCount.mockResolvedValue(1);
      mockGetCurrentQuoteId.mockResolvedValue(null);
      mockGetRandomQuote.mockResolvedValue(mockQuote);

      const result = await getDailyQuote();

      expect(result).toEqual(mockQuote);
    });

    it('picks a random quote when no quote is currently set', async () => {
      mockDate('2025-01-15T10:00:00Z');
      mockGetLastQuoteDate.mockResolvedValue('2025-01-15');
      mockGetCurrentQuoteId.mockResolvedValue(null);
      mockGetRandomQuote.mockResolvedValue(mockQuote);

      const result = await getDailyQuote();

      expect(result).toEqual(mockQuote);
      expect(mockSetCurrentQuoteId).toHaveBeenCalledWith(1);
      expect(mockSetLastQuoteDate).toHaveBeenCalledWith('2025-01-15');
    });
  });
});
