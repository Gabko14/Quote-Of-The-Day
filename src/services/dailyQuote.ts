import {
  getRandomQuoteExcluding,
  getRandomQuote,
  getCurrentQuoteId,
  setCurrentQuoteId,
  clearCurrentQuoteId,
  getLastQuoteDate,
  setLastQuoteDate,
  getQuoteById,
  getQuoteCount,
  Quote,
} from '../db';
import { logger } from '../utils/logger';

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export async function shouldRotateQuote(): Promise<boolean> {
  const lastDate = await getLastQuoteDate();
  const today = getTodayDateString();
  return lastDate !== today;
}

export async function rotateQuoteIfNeeded(): Promise<Quote | null> {
  const needsRotation = await shouldRotateQuote();
  if (!needsRotation) {
    // Return current quote without rotation
    const currentId = await getCurrentQuoteId();
    if (currentId) {
      const quote = await getQuoteById(currentId);
      if (quote) return quote;
      // Quote was deleted, clear stale reference and rotate
      await clearCurrentQuoteId();
    }
    // No valid current quote, pick a new one
    return rotateQuote();
  }

  return rotateQuote();
}

export async function rotateQuote(): Promise<Quote | null> {
  const count = await getQuoteCount();
  if (count === 0) return null;

  const currentId = await getCurrentQuoteId();
  let newQuote: Quote | null = null;

  if (currentId && count > 1) {
    // Try to get a different quote
    newQuote = await getRandomQuoteExcluding(currentId);
  } else {
    // Get any random quote
    newQuote = await getRandomQuote();
  }

  if (newQuote) {
    await setCurrentQuoteId(newQuote.id);
    await setLastQuoteDate(getTodayDateString());
  }

  return newQuote;
}

export async function getDailyQuote(): Promise<Quote | null> {
  // First check if we need to rotate
  const quote = await rotateQuoteIfNeeded();
  if (quote) return quote;

  // No current quote set, pick one
  const random = await getRandomQuote();
  if (random) {
    await setCurrentQuoteId(random.id);
    await setLastQuoteDate(getTodayDateString());
  }
  return random;
}

// Background task version - rotates and returns the quote
export async function rotateDailyQuoteInBackground(): Promise<Quote | null> {
  try {
    return await getDailyQuote();
  } catch (error) {
    logger.error('Error rotating daily quote:', error);
    return null;
  }
}
