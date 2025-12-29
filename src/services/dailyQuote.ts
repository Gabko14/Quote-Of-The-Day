import {
  getRandomQuoteExcluding,
  getRandomQuote,
  getCurrentQuoteId,
  setCurrentQuoteId,
  getLastQuoteDate,
  setLastQuoteDate,
  getQuoteById,
  getQuoteCount,
  getDarkBackground,
  Quote,
} from '../db';
import { generateAndSaveWallpaper, cleanOldWallpapers } from './wallpaperGenerator';
import { setBothWallpapers, isWallpaperSupported } from './wallpaperService';
import { Dimensions } from 'react-native';

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
      return getQuoteById(currentId);
    }
    return null;
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

export async function updateWallpaperWithDailyQuote(): Promise<boolean> {
  try {
    const quote = await getDailyQuote();
    if (!quote) return false;

    const darkBg = await getDarkBackground();
    const { width, height } = Dimensions.get('screen');

    const wallpaperPath = await generateAndSaveWallpaper({
      text: quote.text,
      author: quote.author,
      darkBackground: darkBg,
      width: Math.round(width * 2),
      height: Math.round(height * 2),
    });

    if (!wallpaperPath) return false;

    const supported = await isWallpaperSupported();
    if (supported) {
      await setBothWallpapers(wallpaperPath);
    }

    await cleanOldWallpapers(1);
    return true;
  } catch (error) {
    console.error('Error updating wallpaper with daily quote:', error);
    return false;
  }
}
